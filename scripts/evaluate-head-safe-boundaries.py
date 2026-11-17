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
    def can_collapse(self,keep,drop):
        shared=self.inc[keep] & self.inc[drop]
        if len(shared)!=2:
            return False,"original_open_boundary_preserved",None
        # Never collapse a vertex that participates in any source open edge.
        # The head GLB is already fragmented; contracting a single boundary
        # edge creates the prominent ear/temple holes in the prior 10K trial.
        return super().can_collapse(keep,drop)


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
      "method":"strict no single-face-edge collapse / original geometry only",
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
      "notice":"A topology-preserving >10K fallback is preferred to holey 10K. Do not accept solely by face count."
    }
    result=ROOT/"grey-head-region-lod-v1.safe.report.json"
    result.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
