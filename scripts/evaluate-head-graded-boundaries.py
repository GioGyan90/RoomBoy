#!/usr/bin/env python3
"""Third experimental source-mesh LOD: controlled boundary contraction.

Unlike the failed 10K model this insists on edge-connected face components,
local angular validity and total surface-area conservation. It is *not*
allowed to overwrite the validated 34.5K master or the 10K diagnostic.
"""
import importlib.util
import json
from collections import Counter
from pathlib import Path

import numpy as np
import trimesh

ROOT=Path("public/heads")
spec=importlib.util.spec_from_file_location("regionqem",Path(__file__).with_name("build-head-region-lod.py"))
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class GradedBoundaryQEM(mod.RegionQEM):
    def __init__(self, verts, faces, tags, names):
        super().__init__(verts,faces,tags,names)
        self.area_initial=float(self.area(self.f).sum())
        self.area_current=self.area_initial
        self.min_area=self.area_initial*.955
        self.exclusions=Counter()
        edges=mod.topology_edges(self.f)
        self.source_boundary=set(e for e,fs in edges.items() if len(fs)==1)
        # Only the OUTER ear, eyelid, lip, nose and chin boundaries are frozen.
        self.boundary_features=set()
        for edge,owners in edges.items():
            if len(owners)!=1:continue
            base=mod.base_name(self.names[self.labels[owners[0]]])
            if base in {"ear","orbit","brow","nasalTip","upperLip","lowerLip","chin"}:
                self.boundary_features.update(edge)
        self.component_baseline=component_count(self.f)

    def area(self,triangles):
        v=self.v
        a,b,c=v[triangles[:,0]],v[triangles[:,1]],v[triangles[:,2]]
        return .5*np.linalg.norm(np.cross(b-a,c-a),axis=1)

    def can_collapse(self,keep,drop):
        ok,reason,region=super().can_collapse(keep,drop)
        if not ok:return ok,reason,region
        if keep in self.boundary_features or drop in self.boundary_features:
            return False,"protected_feature_open_edge",None
        edge=(min(keep,drop),max(keep,drop))
        e=np.linalg.norm(self.v[keep]-self.v[drop])
        # Limit collapse reach: no long bridge between disconnected strips.
        if e>.032:
            return False,"collapse_edge_too_long",None
        shared=self.inc[keep]&self.inc[drop]
        live=self.inc[keep]|self.inc[drop]
        surviving=sorted(live-shared)
        if not surviving:
            return False,"component_deletion",None
        old=sum(float(self.area(self.f[f:f+1])[0]) for f in live)
        newfaces=np.asarray([np.where(self.f[f]==drop,keep,self.f[f]) for f in surviving],dtype=np.int64)
        new=float(self.area(newfaces).sum())
        # No obvious surface shrinkage in the one-ring; both closed and open
        # triangles must preserve local area.
        if new < .91*old or new > 1.1*old:
            return False,"local_surface_area",None
        if self.area_current-old+new<self.min_area:
            return False,"global_surface_area",None
        # Do not change the number of discrete edge-connected face islands
        # inside the collapsing vertex neighborhood.
        previous=component_count(np.asarray([self.f[f] for f in sorted(live)],dtype=np.int64))
        following=component_count(newfaces)
        if following>previous:
            return False,"new_local_disconnected_island",None
        return True,"ok",region

    def collapse(self,keep,drop,region):
        oldfaces=self.inc[keep]|self.inc[drop]
        shared=self.inc[keep]&self.inc[drop]
        before=sum(float(self.area(self.f[f:f+1])[0]) for f in oldfaces)
        after=sum(float(self.area(np.where(self.f[f:f+1]==drop,keep,self.f[f:f+1]))[0])
                  for f in oldfaces if f not in shared)
        self.area_current+=after-before
        return super().collapse(keep,drop,region)

def component_count(faces):
    parent=list(range(len(faces)))
    def root(x):
        while parent[x]!=x:
            parent[x]=parent[parent[x]]
            x=parent[x]
        return x
    edgeowner={}
    for fid,tri in enumerate(faces):
        for edge in mod.edges_of(tri):
            other=edgeowner.get(edge)
            if other is None:edgeowner[edge]=fid
            else:
                a,b=root(fid),root(other)
                if a!=b:parent[b]=a
    return len({root(fid) for fid in range(len(faces))})

def main():
    m=trimesh.load(mod.SOURCE,force="scene",process=False).to_geometry()
    original=np.asarray(m.vertices)
    faces=np.asarray(m.faces)
    man=json.loads(mod.MAP.read_text(encoding="utf8"))
    tags=np.full(len(faces),-1,dtype=int)
    for i,g in enumerate(man["groups"]):
        tags[g["faceIds"]]=i
    left=original[faces,0].mean(axis=1)<-1e-12
    dec=GradedBoundaryQEM(original,faces[left],tags[left],[g["id"] for g in man["groups"]])
    out_faces,out_tags=dec.simplify(5000)
    kept_ids=np.unique(out_faces)
    index=np.full(len(original),-1,dtype=np.int64)
    index[kept_ids]=np.arange(len(kept_ids))
    neg=original[kept_ids].copy()
    movable=np.flatnonzero(neg[:,0]!=0)
    twins=np.arange(len(neg),dtype=np.int64)
    twins[movable]=np.arange(len(neg),len(neg)+len(movable))
    reflected=neg[movable].copy()
    reflected[:,0]*=-1
    positions=np.vstack([neg,reflected]).astype(np.float32)
    lf=index[out_faces]
    rf=twins[lf[:,[0,2,1]]]
    result=trimesh.Trimesh(vertices=positions,faces=np.vstack([lf,rf]),process=False)
    name="grey-head-region-lod-v1.graded"
    out=ROOT/(name+".glb")
    result.export(out)
    components=component_count(np.asarray(result.faces))
    parent_components=component_count(faces)
    area=float(result.area)
    area_retention=round(100*area/float(m.area),3)
    source_edges=mod.topology_edges(faces[left])
    remaining_edges=mod.topology_edges(out_faces)
    def border(edges,labels):
        return {e for e,fids in edges.items()
                if len(fids)==2 and labels[fids[0]]!=labels[fids[1]]}
    assert border(source_edges,tags[left])==border(remaining_edges,out_tags)
    report={
      "type":"diagnostic not final",
      "source":str(mod.SOURCE),"result":str(out),
      "sourceFaces":len(faces),"outputFaces":len(result.faces),
      "sourceArea":float(m.area),"outputArea":area,
      "surfaceAreaRetainedPercent":area_retention,
      "minAllowedSurfaceAreaPercent":95.5,
      "sourceComponents":parent_components,"outputComponents":components,
      "componentCountPreserved":components==parent_components,
      "reached10000":len(result.faces)<=10000,
      "sourceOpenEdgesLeft":sum(len(v)==1 for v in source_edges.values()),
      "candidateOpenEdgesLeft":sum(len(v)==1 for v in remaining_edges.values()),
      "collapsed":dict(dec.stats),
      "note":"Reject if components increase, area falls or silhouette changes; do not substitute this for the master."
    }
    (ROOT/(name+".report.json")).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
