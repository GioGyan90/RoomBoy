#!/usr/bin/env python3
"""Measure actual sampled point-to-TRIANGLE surface distance in both directions.

Uses an R-tree closest-triangle search (not distance to nearest source vertex).
A finite area-weighted sample cannot prove the exact Hausdorff bound.
"""
import json
from pathlib import Path

import numpy as np
import trimesh
from trimesh.proximity import closest_point

HEADS=Path("public/heads")
MASTER=HEADS/"grey-head-qem-symmetric.glb"
CANDIDATE=HEADS/"grey-head-region-lod-v1.glb"
REPORT=HEADS/"grey-head-region-lod-v1.report.json"


def mesh(path):
    scene=trimesh.load(path,force="scene",process=False)
    return scene.to_geometry() if hasattr(scene,"to_geometry") else scene.dump(concatenate=True)


def sample_distances(source,target,count,seed):
    points,_=trimesh.sample.sample_surface(source,count,seed=seed)
    distances=[]
    for start in range(0,len(points),400):
        batch=points[start:start+400]
        closest,d,_=closest_point(target,batch)
        assert len(d)==len(batch) and np.isfinite(d).all()
        assert np.allclose(np.linalg.norm(batch-closest,axis=1),d,atol=1e-7)
        distances.extend(float(x) for x in d)
    distances=np.array(distances)
    return {
        "count":len(distances),
        "mean":round(float(np.mean(distances)),7),
        "p50":round(float(np.percentile(distances,50)),7),
        "p95":round(float(np.percentile(distances,95)),7),
        "p99":round(float(np.percentile(distances,99)),7),
        "max":round(float(np.max(distances)),7),
    }


def main():
    source=mesh(MASTER)
    lod=mesh(CANDIDATE)
    normalized_head_height=float(np.ptp(source.vertices[:,1]))
    src_to_lod=sample_distances(source,lod,8000,123)
    lod_to_src=sample_distances(lod,source,8000,456)
    report=json.loads(REPORT.read_text(encoding="utf8"))
    surface={
        "method":"area-weighted uniformly sampled points and exact closest point on opposing TRIANGLE surface (R-tree)",
        "kind":"sampled_bidirectional_point_to_triangle_surface_distance",
        "notExactHausdorff":True,
        "samples":16000,
        "headHeight":round(normalized_head_height,7),
        "masterToCandidate":src_to_lod,
        "candidateToMaster":lod_to_src,
        "symmetricP95":max(src_to_lod["p95"],lod_to_src["p95"]),
        "symmetricP99":max(src_to_lod["p99"],lod_to_src["p99"]),
        "symmetricMaxSampled":max(src_to_lod["max"],lod_to_src["max"]),
    }
    surface["symmetricP95PercentOfHeadHeight"]=round(100*surface["symmetricP95"]/normalized_head_height,4)
    surface["symmetricMaxSampledPercentOfHeadHeight"]=round(100*surface["symmetricMaxSampled"]/normalized_head_height,4)
    report["surfaceReview"]=surface
    report["acceptance"]["surfaceDistanceMeasured"]=True
    report["acceptance"]["visualInspection"]="review screenshot and surface metrics separately; IoU cannot prove feature fidelity"
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(surface,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
