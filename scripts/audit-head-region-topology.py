#!/usr/bin/env python3
"""Audit the 34.5K original head and its 23 *source-indexed* semantic regions.

Never edits either master GLB or its immutable parts. Position duplicates and
index-sharing are deliberately reported separately.
"""
import json
from collections import Counter, defaultdict, deque
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path("public/heads")
SOURCE = ROOT / "grey-head-qem-symmetric.glb"
PARTS = ROOT / "grey-head-qem-symmetric.parts.json"
OUT = ROOT / "grey-head-region-lod-v1.topology.json"
BOUNDARIES = ROOT / "grey-head-region-lod-v1.boundary.json"


def load():
    scene = trimesh.load(SOURCE, force="scene", process=False)
    mesh = scene.to_geometry() if hasattr(scene, "to_geometry") else scene.dump(concatenate=True)
    return np.asarray(mesh.vertices, dtype=np.float64), np.asarray(mesh.faces, dtype=np.int64)


def audit():
    v, faces = load()
    manifest = json.loads(PARTS.read_text(encoding="utf8"))
    assert len(v) == manifest["sourceVertices"] == 31357
    assert len(faces) == manifest["sourceFaces"] == 34500
    tags = np.full(len(faces), -1, dtype=np.int32)
    names = [r["id"] for r in manifest["groups"]]
    for region, group in enumerate(manifest["groups"]):
        for f in group["faceIds"]:
            assert tags[f] == -1, ("duplicate face", f)
            tags[f] = region
        s = set(group["sourceVertexIds"])
        assert all(set(faces[f]).issubset(s) for f in group["faceIds"])
    assert (tags >= 0).all()

    edge_faces = defaultdict(list)
    for fid, tri in enumerate(faces):
        for j in range(3):
            a, b = sorted((int(tri[j]), int(tri[(j + 1) % 3])))
            edge_faces[a, b].append(fid)

    boundary_edges, region_edges, seam_edges, nonmanifold_edges = [], [], [], []
    group_edges = defaultdict(list)
    for edge, owners in edge_faces.items():
        if len(owners) == 1:
            boundary_edges.append(edge)
        elif len(owners) > 2:
            nonmanifold_edges.append(edge)
        if len(owners) == 2 and tags[owners[0]] != tags[owners[1]]:
            region_edges.append(edge)
            pair = tuple(sorted((names[int(tags[owners[0]])], names[int(tags[owners[1]])])))
            group_edges[pair].append(edge)
        if v[edge[0], 0] == 0 and v[edge[1], 0] == 0:
            seam_edges.append((edge, len(owners)))

    protected = set(int(i) for i in np.flatnonzero(v[:, 0] == 0))
    reasons = {"symmetry_plane": len(protected)}
    for kind, edges in (("region_shared", region_edges), ("source_open", boundary_edges),
                        ("source_nonmanifold", nonmanifold_edges)):
        before = len(protected)
        protected.update(i for edge in edges for i in edge)
        reasons[kind] = {"edges": len(edges), "new_vertices": len(protected) - before}
    for region, g in enumerate(manifest["groups"]):
        if g["priority"] != "high":
            continue
        # First attempt: exact landmarks in eye, nose, lips, chin and ear stay
        # unchanged. The later reducer may simplify their *interiors* only.
        before = len(protected)
        protected.update(int(i) for f in g["faceIds"] for i in faces[f])
        reasons["high_priority_" + g["id"]] = len(protected) - before

    groups = []
    for region, group in enumerate(manifest["groups"]):
        fids = group["faceIds"]
        parent = {fid: fid for fid in fids}
        def root(fid):
            while parent[fid] != fid:
                parent[fid] = parent[parent[fid]]
                fid = parent[fid]
            return fid
        def union(a, b):
            ra, rb = root(a), root(b)
            if ra != rb:
                parent[rb] = ra
        internal = 0
        exposed = 0
        for edge, owners in edge_faces.items():
            local = [f for f in owners if tags[f] == region]
            if len(local) > 1:
                internal += 1
                for fid in local[1:]:
                    union(local[0], fid)
            elif len(local) == 1:
                exposed += 1
        component_sizes = Counter(root(fid) for fid in fids)
        groups.append({
            "id": group["id"], "family": group["family"],
            "faces": len(fids), "vertices": len(group["sourceVertexIds"]),
            "components_by_source_indices": len(component_sizes),
            "largest_components": sorted(component_sizes.values(), reverse=True)[:12],
            "single_face_islands": sum(n == 1 for n in component_sizes.values()),
            "internal_edges": internal, "exposed_edges": exposed,
            "locked_vertices": sum(int(i in protected) for i in group["sourceVertexIds"]),
        })
    unique_pos, inverse, counts = np.unique(v, axis=0, return_inverse=True, return_counts=True)
    coord_edge_faces = defaultdict(int)
    for tri in faces:
        for j in range(3):
            a, b = sorted((int(inverse[tri[j]]), int(inverse[tri[(j+1) % 3]])))
            coord_edge_faces[a, b] += 1

    result = {
        "source": SOURCE.name, "manifest": PARTS.name,
        "faces": len(faces), "vertices": len(v), "regions": len(groups),
        "unique_coordinate_positions": len(unique_pos),
        "duplicate_position_vertices": int(np.sum(counts - 1)),
        "source_index_edges": {
            "total": len(edge_faces), "single_use": len(boundary_edges),
            "double_use": sum(len(fs) == 2 for fs in edge_faces.values()),
            "nonmanifold": len(nonmanifold_edges),
        },
        "geometric_edge_use": {
            "total": len(coord_edge_faces),
            "single_use": sum(c == 1 for c in coord_edge_faces.values()),
            "nonmanifold": sum(c > 2 for c in coord_edge_faces.values()),
        },
        "symmetry_plane": {
            "vertices": int(np.count_nonzero(v[:, 0] == 0)),
            "edges": len(seam_edges),
            "non_two_face_edges": sum(n != 2 for _, n in seam_edges),
        },
        "shared_region_edges": len(region_edges),
        "region_adjacency": [
            {"a": a, "b": b, "edges": len(edges)}
            for (a, b), edges in sorted(group_edges.items(), key=lambda p: -len(p[1]))
        ],
        "protected_vertex_count": len(protected),
        "protected_by_reason": reasons,
        "groups": groups,
        "warning": "Index-edge topology differs from position-welded topology; region boundaries are provisional.",
    }
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    BOUNDARIES.write_text(json.dumps({
        "schema": "roomboy.head-lod-boundary.v1",
        "source": SOURCE.name,
        "protectedSourceVertexIds": sorted(protected),
        "regionSharedEdges": region_edges,
        "sourceBoundaryEdges": boundary_edges,
        "sourceNonManifoldEdges": nonmanifold_edges,
        "seamSourceEdges": [e for e, _ in seam_edges],
        "reasons": reasons,
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")
    print(json.dumps({
        "faces": result["faces"],
        "vertices": result["vertices"],
        "unique_positions": result["unique_coordinate_positions"],
        "source_edges": result["source_index_edges"],
        "geometric_edges": result["geometric_edge_use"],
        "shared_region_edges": len(region_edges),
        "protected_vertices": len(protected),
        "per_part": [(g["id"], g["faces"], g["components_by_source_indices"]) for g in groups],
    }, indent=2))
    return result


if __name__ == "__main__":
    audit()
