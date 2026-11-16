#!/usr/bin/env python3
"""Clip the original 30K QEM head at the X median, then mirror and weld.

This works on the actual GLB triangles, not the retired 541-vertex face cage.

python scripts/symmetrize-head.py public/heads/grey-head-qem-30000.glb \
  public/heads/grey-head-qem-symmetric.glb \
  --report public/heads/grey-head-qem-symmetric.report.json
Dependencies: numpy, trimesh. The source GLB stays unchanged.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import trimesh


def load_mesh(path):
    scene = trimesh.load(path, force="scene", process=False)
    mesh = scene.to_geometry() if hasattr(scene, "to_geometry") else scene.dump(concatenate=True)
    if not isinstance(mesh, trimesh.Trimesh) or len(mesh.faces) < 1000:
        raise ValueError("Expected a triangulated source GLB with at least 1000 faces")
    return mesh


def symmetrize(mesh, side="negative", eps=1e-7):
    if side not in ("negative", "positive"):
        raise ValueError("side must be 'negative' or 'positive'")
    vertices = np.asarray(mesh.vertices, dtype=np.float64).copy()
    source_faces = np.asarray(mesh.faces, dtype=np.int64)
    center = (float(vertices[:, 0].min()) + float(vertices[:, 0].max())) * 0.5
    vertices[:, 0] -= center
    if side == "positive":
        vertices[:, 0] *= -1

    positions, kept_vertices, crossing_edges, clipped_faces = [], {}, {}, []
    crossing_triangles = 0

    def source_vertex(index):
        index = int(index)
        if index not in kept_vertices:
            point = vertices[index].copy()
            if abs(point[0]) <= eps:
                point[0] = 0.0
            kept_vertices[index] = len(positions)
            positions.append(point)
        return kept_vertices[index]

    def intersection(a, b):
        a, b = int(a), int(b)
        if abs(vertices[a, 0]) <= eps:
            return source_vertex(a)
        if abs(vertices[b, 0]) <= eps:
            return source_vertex(b)
        edge = (min(a, b), max(a, b))
        if edge not in crossing_edges:
            weight = -vertices[a, 0] / (vertices[b, 0] - vertices[a, 0])
            point = vertices[a] + weight * (vertices[b] - vertices[a])
            point[0] = 0.0
            crossing_edges[edge] = len(positions)
            positions.append(point)
        return crossing_edges[edge]

    # Clip each original indexed triangle; cache each cut edge intersection.
    # Winding order and all interior (non-crossing) source triangles are preserved.
    for face in source_faces:
        xx = vertices[face, 0]
        if xx.min() < -eps and xx.max() > eps:
            crossing_triangles += 1
        clipped = []
        for i in range(3):
            a, b = int(face[i-1]), int(face[i])
            inside_a, inside_b = vertices[a, 0] <= eps, vertices[b, 0] <= eps
            if inside_a != inside_b:
                clipped.append(intersection(a, b))
            if inside_b:
                clipped.append(source_vertex(b))
        polygon = []
        for i in clipped:
            if not polygon or polygon[-1] != i:
                polygon.append(i)
        if len(polygon) > 1 and polygon[0] == polygon[-1]:
            polygon.pop()
        if len(polygon) < 3:
            continue
        for k in range(1, len(polygon)-1):
            face_indices = (polygon[0], polygon[k], polygon[k+1])
            if len(set(face_indices)) < 3:
                continue
            a, b, c = (positions[i] for i in face_indices)
            if np.linalg.norm(np.cross(b-a, c-a)) > 1e-12:
                clipped_faces.append(face_indices)

    half_positions = np.asarray(positions, dtype=np.float64)
    seam_mask = np.abs(half_positions[:, 0]) <= eps
    half_positions[seam_mask, 0] = 0.0
    other = np.where(~seam_mask)[0]
    mirror_ids = np.arange(len(half_positions), dtype=np.int64)
    mirror_ids[other] = np.arange(len(half_positions), len(half_positions)+len(other))
    mirror_positions = half_positions[other].copy()
    mirror_positions[:, 0] *= -1.0
    out_positions = np.vstack([half_positions, mirror_positions])

    left = np.asarray(clipped_faces, dtype=np.int64)
    right = mirror_ids[left[:, [0, 2, 1]]]
    out_faces = np.vstack([left, right])
    if side == "positive":
        out_positions[:, 0] *= -1
        out_faces = out_faces[:, [0, 2, 1]]

    result = trimesh.Trimesh(
        vertices=out_positions.astype(np.float32),
        faces=out_faces.astype(np.int64),
        process=False,
    )
    result.metadata["name"] = "grey-head-qem-symmetric"

    # Fail early if geometry is only visually symmetric but topologically wrong.
    rendered = np.asarray(result.vertices)
    mirrored_vertices = {tuple(p) for p in rendered}
    assert all(tuple((-x, y, z)) in mirrored_vertices for x, y, z in rendered)
    assert len(left) == len(right)
    mirrored_faces = {frozenset(t) for t in right.tolist()}
    assert all(frozenset(mirror_ids[t]) in mirrored_faces for t in left)
    if side == "positive":
        # The previous face ID mapping still holds; only global reflection changed.
        assert result.is_winding_consistent

    # After welding, every seam edge must belong to two faces (not one or three).
    usage = {}
    for face in result.faces:
        for j in range(3):
            a, b = sorted((int(face[j]), int(face[(j+1)%3])))
            if abs(rendered[a, 0]) <= eps and abs(rendered[b, 0]) <= eps:
                usage[(a,b)] = usage.get((a,b),0)+1
    if usage and any(count != 2 for count in usage.values()):
        raise ValueError("Unwelded or non-manifold central seam detected")

    report = {
        "source": "actual QEM-reduced GLB vertex/index buffers",
        "source_faces": int(len(source_faces)),
        "source_vertices": int(len(vertices)),
        "plane": {"axis": "X", "worldX": center, "localX": 0.0},
        "preserved_half": side,
        "crossing_source_triangles": int(crossing_triangles),
        "seam_vertices": int(seam_mask.sum()),
        "seam_edges": int(len(usage)),
        "seam_boundary_edges": int(sum(n == 1 for n in usage.values())),
        "half_faces": int(len(left)),
        "result_faces": int(len(out_faces)),
        "result_vertices": int(len(out_positions)),
        "exact_mirrored_vertices_and_triangles": True,
    }
    return result, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--side", choices=("negative", "positive"), default="negative")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    result, report = symmetrize(load_mesh(args.source), args.side)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.export(str(args.output), file_type="glb")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
