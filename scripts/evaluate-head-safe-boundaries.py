#!/usr/bin/env python3
"""Non-shipping diagnostic: can an indexed source mesh retain open boundary faces?

Strict experiment is intentionally not treated as a 10K acceptance candidate:
source has 28,090 pre-existing single-use edges. Preserve all such edges and
source region interfaces, and report attainable triangle count. This rules out
a misleading claim that the holey 10K diagnostic is production-safe.
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
import trimesh

ROOT=Path("public/heads")
spec=importlib.util.spec_from_file_location("headqem",Path(__file__).with_name("build-head-region-lod.py"))
qem=importlib.util.module_from_spec(spec)
spec.loader.exec_module(qem)


class BoundarySafeQEM(qem.RegionQEM):
    """Protect original component connectivity and local surface area."""
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        usage=qem.topology_edges(self.f)
        # Open edges are not closed by fictional triangles. Never contract the
        # actual source boundary itself; interior reduction is still allowed.
        self.source_open_edges={edge for edge,owners in usage.items() if len(owners)==1}
        self.source_open_vertices=set(x for edge in self.source_open_edges for x in edge)
        self.initial_face_areas=self.face_area(self.f)
        self.total_area=float(self.initial_face_areas.sum())
        self.current_area=self.total_area
        self.min_area=self.total_area*0.975
        self.area_rejected=0
        self.component_rejected=0
        self.start_components=face_components(self.f)

    def face_area(self,triangles):
        a,b,c=self.v[triangles[:,0]],self.v[triangles[:,1]],self.v[triangles[:,2]]
        return np.linalg.norm(np.cross(b-a,c-a),axis=1)*0.5

    def can_collapse(self,keep,drop):
        shared=self.inc[keep]&self.inc[drop]
        if len(shared)!=2:
            return False,"source_open_edge_preserved",None
        # Collapsing even an interior edge incident to a boundary vertex can
        # destroy a narrow strip and create the missing temporal/ear surface.
        if keep in self.source_open_vertices or drop in self.source_open_vertices:
            return False,"source_boundary_vertex_preserved",None
        ok,reason,region=super().can_collapse(keep,drop)
        if not ok:
            return ok,reason,region
        # Removing two faces can disconnect multiple face-fans linked only
        # through them. On the local face patch we require every surviving
        # incident face to be connected through real, shared INDEX edges.
        changed=(self.inc[keep]|self.inc[drop])
        surviving=sorted(changed-shared)
        if not surviving:return False,"component_removed",None
        local_faces=[]
        old_area=0.
        new_area=0.
        for fid in changed:
            tri=self.f[fid]
            old_area+=float(self.face_area(tri[None,:])[0])
            if fid in shared:continue
            update=np.where(tri==drop,keep,tri)
            new_area+=float(self.face_area(update[None,:])[0])
            local_faces.append(update)
        # preserve local area and a global 97.5% area coverage threshold
        if new_area<old_area*0.82 or self.current_area-old_area+new_area<self.min_area:
            self.area_rejected+=1
            return False,"surface_area_loss",None
        # All updated incident faces need to form one edge-connected local
        # patch. This is conservative, especially with fragmented input.
        if face_components(np.asarray(local_faces,dtype=np.int64))!=1:
            self.component_rejected+=1
            return False,"local_component_split",None
        return True,"ok",region

    def collapse(self,keep,drop,region):
        changed=self.inc[keep]|self.inc[drop]
        old_area=sum(float(self.face_area(self.f[fid:fid+1])[0]) for fid in changed)
        shared=self.inc[keep]&self.inc[drop]
        new_area=sum(float(self.face_area(np.where(self.f[fid:fid+1]==drop,keep,self.f[fid:fid+1]))[0])
                     for fid in changed if fid not in shared)
        self.current_area+=new_area-old_area
        return super().collapse(keep,drop,region)


def face_components(faces):
    """Exact source-index edge connectivity; never fill or alter any holes."""
    parent=list(range(len(faces)))
    def find(x):
        while parent[x]!=x:
            parent[x]=parent[parent[x]]
            x=parent[x]
        return x
    def join(a,b):
        a=find(a)
        b=find(b)
        if a!=b:parent[b]=a
    seen={}
    for fid,tri in enumerate(faces):
        for edge in qem.edges_of(tri):
            if edge in seen:
                join(fid,seen[edge])
            else:
                seen[edge]=fid
    return len({find(i) for i in range(len(faces))})


def main():
    src=trimesh.load(qem.SOURCE,force="scene",process=False)
    source=src.to_geometry() if hasattr(src,"to_geometry") else src.dump(concatenate=True)
    vertices=np.asarray(source.vertices,dtype=np.float64)
    faces=np.asarray(source.faces,dtype=np.int64)
    normals=np.asarray(source.vertex_normals,dtype=np.float64)
    regions=json.loads(qem.MAP.read_text(encoding="utf8"))["groups"]
    tags=np.full(len(faces),-1,dtype=int)
    for region_id,group in enumerate(regions):
        tags[group["faceIds"]]=region_id
    left=vertices[faces,0].mean(axis=1)<-1e-12
    names=[r["id"] for r in regions]
    dec=BoundarySafeQEM(vertices,faces[left],tags[left],names)
    kept,tags_left=dec.simplify(5000)
    # Reuse true original vertex indices for the exact mirrored mesh.
    used=np.unique(kept)
    mapping=np.full(len(vertices),-1,dtype=np.int64)
    mapping[used]=np.arange(len(used))
    pos=vertices[used].copy()
    norm=normals[used].copy()
    others=np.flatnonzero(pos[:,0]!=0)
    mirror=np.arange(len(pos),dtype=int)
    mirror[others]=np.arange(len(pos),len(pos)+len(others))
    rpos=pos[others].copy()
    rpos[:,0]*=-1
    rnorm=norm[others].copy()
    rnorm[:,0]*=-1
    indexed=mapping[kept]
    fullfaces=np.vstack((indexed,mirror[indexed[:,[0,2,1]]]))
    fullverts=np.vstack((pos,rpos)).astype(np.float32)
    fullnorm=np.vstack((norm,rnorm)).astype(np.float32)
    mesh=trimesh.Trimesh(vertices=fullverts,faces=fullfaces,vertex_normals=fullnorm,process=False)
    output=ROOT/"grey-head-region-lod-v1.safe.glb"
    mesh.export(output)
    before=qem.topology_edges(faces[left])
    after=qem.topology_edges(kept)
    area_src=float(source.area)
    area_safe=float(mesh.area)
    report={
      "method":"boundary vertex locked + local dual-graph component continuity + local and global area safeguards",
      "sourceFaces":len(faces),"outputFaces":len(mesh.faces),
      "outputVertices":len(mesh.vertices),
      "targetFaces":10000,
      "reachedTarget":len(mesh.faces)<=10000,
      "sourceSurfaceArea":area_src,"candidateSurfaceArea":area_safe,
      "areaRetainedPercent":round(100*area_safe/area_src,3),
      "sourceConnectedComponents":face_components(faces),
      "candidateConnectedComponents":face_components(fullfaces),
      "sourceLeftOpenEdges":sum(len(x)==1 for x in before.values()),
      "candidateLeftOpenEdges":sum(len(x)==1 for x in after.values()),
      "source":qem.SOURCE.name,"output":output.name,
      "collapses":dict(dec.stats),
      "areaFloorPercent":97.5,
      "localComponentSplitRejected":dec.component_rejected,
      "surfaceAreaCollapseRejected":dec.area_rejected,
      "notice":"A topology-preserving >10K fallback is preferred to holey 10K. Do not accept solely by face count."
    }
    result=ROOT/"grey-head-region-lod-v1.safe.report.json"
    result.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    report["componentCountPreserved"]=report["sourceConnectedComponents"]==report["candidateConnectedComponents"]
    report["areaPass"]=report["areaRetainedPercent"]>=97.4
    result.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\\n",encoding="utf8")
    assert report["componentCountPreserved"],"CANDIDATE REJECTED: new edge-disconnected face components"
    assert report["areaPass"],"CANDIDATE REJECTED: excessive surface area lost"
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
