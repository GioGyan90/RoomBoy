#!/usr/bin/env python3
"""RoomBoy LOD1: 10k-face *copy* of the symmetric 34.5k GLB.

The committed symmetric parent is never changed. Its source geometry contains
many disconnected micro-patches; direct QEM leaves conspicuous holes. Instead,
build a continuous, ray-projected low-density cranial backing and separately
QEM-reduce preserved eye, nose, lip and ear source surface patches. This is a
first-pass hybrid LOD, NOT watertight final retopology. Exactly mirrored sides,
original source normals on nearest feature vertices, and no source upload.

Requires numpy, scipy, trimesh, vtk.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import trimesh
import vtk
from scipy.spatial import cKDTree
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray, vtk_to_numpy


FEATURE_BUDGETS = (("ear", 900), ("eye", 900), ("nose", 250), ("lip", 150))
LONGITUDE = 80
LATITUDE = 36
SHELL_FACES = 2 * LONGITUDE * (LATITUDE - 1)  # 5600
EXPECTED_SOURCE_FACES = 34500


def make_poly(vertices, faces):
    vertices = np.asarray(vertices, dtype=np.float64)
    faces = np.asarray(faces, dtype=np.int64)
    points = vtk.vtkPoints()
    points.SetData(numpy_to_vtk(vertices, deep=True))
    cells = vtk.vtkCellArray()
    cells.SetData(
        numpy_to_vtkIdTypeArray(np.arange(0, len(faces) * 3 + 1, 3, dtype=np.int64), deep=True),
        numpy_to_vtkIdTypeArray(faces.ravel(), deep=True),
    )
    model = vtk.vtkPolyData()
    model.SetPoints(points)
    model.SetPolys(cells)
    return model


def source_model(path):
    scene = trimesh.load(path, force="scene", process=False)
    mesh = scene.to_geometry()
    if not isinstance(mesh, trimesh.Trimesh) or len(mesh.faces) != EXPECTED_SOURCE_FACES:
        raise ValueError("The unchanged 34,500-face symmetric GLB is required")
    positions = np.asarray(mesh.vertices, dtype=np.float64)
    faces = np.asarray(mesh.faces, dtype=np.int64)
    normals = np.asarray(mesh.vertex_normals, dtype=np.float64)
    if normals.shape != positions.shape:
        raise ValueError("Original per-vertex normals are required")
    negative_mask = positions[faces].mean(axis=1)[:, 0] < -1e-10
    if negative_mask.sum() != EXPECTED_SOURCE_FACES // 2:
        raise ValueError("Symmetric parent is missing exactly half of its indexed faces")
    return positions, faces, normals, faces[negative_mask]


def patch_masks(points):
    ax, y, z = np.abs(points[:, 0]), points[:, 1], points[:, 2]
    return (
        (ax > .735) & (y > -.35) & (y < .43) & (z > -.74) & (z < -.19),
        (ax > .17) & (ax < .68) & (y > -.15) & (y < .37) & (z > .05),
        (ax < .28) & (y > -.53) & (y < .31) & (z > .10),
        (ax < .39) & (y > -.73) & (y < -.38) & (z > .05),
    )


def reduce_patch(positions, normals, source_faces, name, face_budget):
    unique, inverse = np.unique(source_faces, return_inverse=True)
    verts = positions[unique]
    original_normals = normals[unique]
    local_faces = inverse.reshape(-1, 3)
    poly = make_poly(verts, local_faces)

    def run(target):
        reducer = vtk.vtkQuadricDecimation()
        reducer.SetInputData(poly)
        reducer.SetTargetReduction(max(0.0, 1.0 - target / len(local_faces)))
        reducer.SetVolumePreservation(True)
        reducer.SetBoundaryWeightFactor(5.0)
        reducer.Update()
        out = reducer.GetOutput()
        result_verts = vtk_to_numpy(out.GetPoints().GetData()).copy()
        result_faces = vtk_to_numpy(out.GetPolys().GetConnectivityArray()).reshape(-1, 3).copy()
        return result_verts, result_faces

    target = min(face_budget, len(local_faces))
    out_vertices, out_faces = run(target)
    while len(out_faces) > face_budget and target > 1:
        target -= 1
        out_vertices, out_faces = run(target)
    if len(out_faces) < face_budget - 20:
        raise ValueError(f"{name}: QEM discarded too much geometry ({len(out_faces)} of {face_budget})")

    # The source half is x<=0; QEM only moves a few near-axis nodes across 0.
    # Clip these tiny deviations to avoid an asymmetric patch when mirrored.
    out_vertices[:, 0] = np.minimum(out_vertices[:, 0], 0.0)
    _, nearest = cKDTree(verts).query(out_vertices, workers=-1)
    out_normals = original_normals[nearest].copy()
    seam = np.abs(out_vertices[:, 0]) < 1e-9
    out_normals[seam, 0] = 0.0
    out_normals /= np.maximum(np.linalg.norm(out_normals, axis=1, keepdims=True), 1e-10)

    # Mirror the actual new feature topology. Do not independently decimate right side.
    mirrored = np.where(out_vertices[:, 0] < -1e-9)[0]
    ids = np.arange(len(out_vertices), dtype=np.int64)
    ids[mirrored] = len(out_vertices) + np.arange(len(mirrored))
    full_vertices = np.vstack([out_vertices, out_vertices[mirrored] * [-1, 1, 1]])
    full_normals = np.vstack([out_normals, out_normals[mirrored] * [-1, 1, 1]])
    full_faces = np.vstack([out_faces, ids[out_faces[:, [0, 2, 1]]]])
    mesh = trimesh.Trimesh(vertices=full_vertices.astype(np.float32),
                           faces=full_faces, vertex_normals=full_normals.astype(np.float32),
                           process=False)
    return mesh, {"name": name, "sourceHalfFaces": int(len(local_faces)),
                  "lodHalfFaces": int(len(out_faces)),
                  "lodFaces": int(len(full_faces)),
                  "algorithm": "source triangle QEM; nearest source normal transfer"}


def shell_model(positions, faces):
    # The high-resolution decimated parent has many microscopic disconnected
    # components. A connected radial backing keeps all view angles filled.
    # Four anatomical detail patches will sit on top of the lightly recessed shell.
    poly = make_poly(positions, faces)
    ray_tree = vtk.vtkOBBTree()
    ray_tree.SetDataSet(poly)
    ray_tree.BuildLocator()
    origin = np.array([0.0, 0.05, -0.30])
    distances = np.linalg.norm(positions - origin, axis=1)
    source_dirs = (positions - origin) / np.maximum(distances[:, None], 1e-10)
    point_tree = cKDTree(source_dirs)

    def trace(direction):
        hits = vtk.vtkPoints()
        cell_ids = vtk.vtkIdList()
        ray_tree.IntersectWithLine(origin, origin + direction * 4.0, hits, cell_ids)
        if hits.GetNumberOfPoints():
            length = max(np.linalg.norm(np.asarray(hits.GetPoint(j)) - origin)
                         for j in range(hits.GetNumberOfPoints()))
        else:
            d, ids = point_tree.query(direction, k=8)
            length = np.average(distances[ids], weights=1.0 / (d + .003) ** 2)
        p = origin + direction * length
        ax, y, z = abs(p[0]), p[1], p[2]
        # Recess only the supporting surface underneath the real detail patches.
        feature = ((ax < .7 and -.78 < y < .38 and z > .07)
                   or (ax > .70 and -.4 < y < .45 and -.8 < z < .1))
        if feature:
            p -= direction * .018
        return p

    # Sample only negative X and the shared center; the positive half is always
    # reflected from these exact vertices (not independently ray-cast).
    ring_count = (LATITUDE - 1) * LONGITUDE
    vertices = np.zeros((ring_count + 2, 3), dtype=np.float64)
    for yi in range(1, LATITUDE):
        elevation = -math.pi / 2 + math.pi * yi / LATITUDE
        row = (yi - 1) * LONGITUDE
        for j in [0, LONGITUDE // 2] + list(range(LONGITUDE // 2 + 1, LONGITUDE)):
            azimuth = j * 2 * math.pi / LONGITUDE
            direction = np.array([math.cos(elevation) * math.sin(azimuth),
                                  math.sin(elevation),
                                  math.cos(elevation) * math.cos(azimuth)])
            vertex = trace(direction)
            if j in (0, LONGITUDE // 2):
                vertex[0] = 0.0
            vertices[row + j] = vertex
        for j in range(1, LONGITUDE // 2):
            original = vertices[row + LONGITUDE - j].copy()
            original[0] *= -1.0
            vertices[row + j] = original

    bottom, top = ring_count, ring_count + 1
    vertices[bottom] = [0.0, np.min(positions[:, 1]), origin[2]]
    vertices[top] = [0.0, np.max(positions[:, 1]), origin[2]]
    triangles = []
    for yi in range(LATITUDE - 2):
        for j in range(LONGITUDE):
            a = yi * LONGITUDE + j
            b = yi * LONGITUDE + (j + 1) % LONGITUDE
            c = (yi + 1) * LONGITUDE + j
            d = (yi + 1) * LONGITUDE + (j + 1) % LONGITUDE
            # Opposite quad diagonals on mirrored longitude sectors make
            # triangle topology symmetric as well as vertex positions.
            if j < LONGITUDE // 2:
                triangles.extend(((a, c, d), (a, d, b)))
            else:
                triangles.extend(((a, c, b), (b, c, d)))
    for j in range(LONGITUDE):
        triangles.append((bottom, j, (j + 1) % LONGITUDE))
        triangles.append(((LATITUDE - 2) * LONGITUDE + j,
                          top,
                          (LATITUDE - 2) * LONGITUDE + (j + 1) % LONGITUDE))
    mesh = trimesh.Trimesh(vertices=vertices.astype(np.float32),
                           faces=np.asarray(triangles, dtype=np.int32), process=False)
    if len(mesh.faces) != SHELL_FACES or not mesh.is_watertight:
        raise ValueError("Radial base must remain a connected and closed LOD surface")
    return mesh


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", type=Path, default=Path("public/heads/grey-head-qem-symmetric.glb"))
    ap.add_argument("--output", type=Path, default=Path("public/heads/grey-head-lod1-10000.glb"))
    ap.add_argument("--report", type=Path, default=Path("public/heads/grey-head-lod1-10000.report.json"))
    args = ap.parse_args()
    pos, faces, normals, half_faces = source_model(args.source)
    shell = shell_model(pos, faces)
    pcenter = pos[half_faces].mean(axis=1)
    masks = patch_masks(pcenter)
    occupied = np.zeros(len(half_faces), dtype=bool)
    pieces = [shell]
    patch_reports = []
    for ((name, budget), mask) in zip(FEATURE_BUDGETS, masks):
        mask = mask & ~occupied
        occupied |= mask
        patch, report = reduce_patch(pos, normals, half_faces[mask], name, budget)
        pieces.append(patch)
        patch_reports.append(report)
    output = trimesh.util.concatenate(pieces)
    total = len(output.faces)
    if not 9700 <= total <= 10000:
        raise ValueError(f"LOD1 must stay near or under 10k faces, got {total}")
    if not np.isfinite(output.vertices).all():
        raise ValueError("Nonfinite vertices in LOD1")

    # Each source hemisphere is mirrored from the SAME geometry, not separately
    # simplified. Validate both positions and the bounding box.
    q = np.round(np.asarray(output.vertices), 6)
    mirror = {tuple(p) for p in q}
    if not all(tuple((-x, y, z)) in mirror for x, y, z in q):
        raise ValueError("Asymmetric LOD1 position discovered")
    if not np.allclose(output.bounds[0, 0], -output.bounds[1, 0], atol=1e-6):
        raise ValueError("Asymmetric LOD1 extents")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.export(str(args.output), file_type="glb")
    report = {
        "schema": "roomboy.head-lod.v1",
        "source": args.source.name,
        "lod": args.output.name,
        "targetFaces": 10000,
        "sourceFaces": len(faces),
        "resultFaces": total,
        "resultVertices": len(output.vertices),
        "shellFaces": len(shell.faces),
        "patches": patch_reports,
        "symmetry": "negative X source patches mirrored; base radial sampling mirrored",
        "limitations": [
            "First-pass hybrid LOD: a watertight radial base is overlapped by real source feature patches.",
            "Not a single welded manifold at feature boundaries; further retopology is required.",
            "Original source face IDs do not survive QEM or radial sampling.",
            "Preserved source normals on patches; scalar ray surface approximates the cranial shell.",
        ],
    }
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
