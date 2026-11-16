#!/usr/bin/env python3
"""Reproduce the RoomBoy head's *source-mesh* QEM reduction.

Optional local tool, not run by Vite/GitHub Pages CI.
First:
  node scripts/read-head-reference.mjs grey-head-fast-medium.glb .head-work
Then:
  python scripts/decimate-head.py --source .head-work --faces 30000 \
    --output public/heads/grey-head-qem-30000.glb

Dependencies: numpy, scipy, trimesh, vtk.
The 18.9 MB user-supplied original GLB is deliberately not stored in git.
"""
import argparse
from pathlib import Path
import numpy as np
import trimesh
import vtk
from scipy.spatial import cKDTree
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray, vtk_to_numpy


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", type=Path, default=Path(".head-work"))
    ap.add_argument("--faces", type=int, default=30000)
    ap.add_argument("--output", type=Path, default=Path("public/heads/grey-head-qem-30000.glb"))
    args = ap.parse_args()

    pos = np.fromfile(args.source / "head-ref-positions.bin", dtype="<f4").reshape(-1, 3)
    normals = np.fromfile(args.source / "head-ref-normals.bin", dtype="<f4").reshape(-1, 3)
    faces = np.fromfile(args.source / "head-ref-indices.bin", dtype="<u4").reshape(-1, 3)
    if len(pos) != len(normals) or np.max(faces) >= len(pos):
        raise ValueError("The decoded source buffer sizes do not match")
    if not 1000 <= args.faces < len(faces):
        raise ValueError("Target triangle count must be between 1000 and original count")

    points = vtk.vtkPoints()
    points.SetData(numpy_to_vtk(pos.astype(np.float64), deep=True))
    cells = vtk.vtkCellArray()
    cells.SetData(
        numpy_to_vtkIdTypeArray(np.arange(0, 3 * len(faces) + 1, 3, dtype=np.int64), deep=True),
        numpy_to_vtkIdTypeArray(faces.astype(np.int64).ravel(), deep=True),
    )
    mesh = vtk.vtkPolyData()
    mesh.SetPoints(points)
    mesh.SetPolys(cells)
    reducer = vtk.vtkQuadricDecimation()
    reducer.SetInputData(mesh)
    reducer.SetTargetReduction(1.0 - args.faces / len(faces))
    reducer.SetVolumePreservation(True)
    reducer.SetAttributeErrorMetric(False)
    reducer.Update()

    out = reducer.GetOutput()
    verts = vtk_to_numpy(out.GetPoints().GetData()).copy().astype(np.float32)
    out_faces = vtk_to_numpy(out.GetPolys().GetConnectivityArray()).reshape(-1, 3).copy().astype(np.uint32)

    # Source-authored vertex normals are part of the characteristic flat/anime
    # appearance. Transfer the nearest source normals instead of smoothing them
    # away with an automatic "compute normals" pass.
    distances, source_idx = cKDTree(pos).query(verts, workers=-1)
    reduced_normals = normals[source_idx].copy()
    lengths = np.linalg.norm(reduced_normals, axis=1)
    reduced_normals /= np.maximum(lengths, 1e-8)[:, None]

    # Match the head editor's pre-existing source coordinate normalization.
    lo, hi = pos.min(axis=0), pos.max(axis=0)
    scale = np.float32(2.25 / (hi[1] - lo[1]))
    offset = np.array(
        [-(lo[0] + hi[0]) * 0.5 * scale, -1.02 - lo[1] * scale, 0.82 - hi[2] * scale],
        dtype=np.float32
    )
    verts = (verts * scale + offset).astype(np.float32)
    result = trimesh.Trimesh(
        vertices=verts, faces=out_faces, process=False,
        vertex_normals=reduced_normals,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.export(str(args.output), file_type="glb")
    print({
        "source_faces": len(faces), "result_faces": len(out_faces),
        "result_vertices": len(verts), "output": str(args.output),
        "bytes": args.output.stat().st_size,
        "nearest_source_vertex_error_p95": float(np.quantile(distances, .95)),
    })


if __name__ == "__main__":
    main()
