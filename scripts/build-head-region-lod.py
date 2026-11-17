#!/usr/bin/env python3
"""Constrained source-triangle region LOD experiment for the RoomBoy head.

Every output triangle originates from an input triangle after QEM edge collapse.
No generated skull shell, patches, Poisson surface, or fill triangles.
Collapses are restricted to one original semantic region and left X hemisphere;
the right hemisphere is an exact indexed reflection. Cross-region seams and
X=0 seam vertices are immutable. Existing non-feature open edges may collapse
with curvature penalties; newly introduced cracks are forbidden.

The report explicitly marks >10,000-face results as unaccepted candidates.
"""
import heapq
import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path("public/heads")
PREFIX = "grey-head-region-lod-v1"
SOURCE = ROOT / "grey-head-qem-symmetric.glb"
MAP = ROOT / "grey-head-qem-symmetric.parts.json"
OUT = ROOT / (PREFIX + ".glb")
PART_OUT = ROOT / (PREFIX + ".parts.glb")
MANIFEST_OUT = ROOT / (PREFIX + ".parts.json")
REPORT_OUT = ROOT / (PREFIX + ".report.json")

# Minimum retained fractions are deliberately higher around key features.
MIN_RETAIN = {
    "vault": .095, "occiput": .085, "forehead": .18,
    "temple": .18, "lateral": .15, "brow": .55, "orbit": .51,
    "nasalBridge": .49, "nasalTip": .53, "midface": .50,
    "cheek": .43, "upperLip": .58, "lowerLip": .59,
    "chin": .39, "jaw": .36, "ear": .43,
}
PRIORITY = {
    "vault": .7, "occiput": .65, "forehead": 1.1,
    "temple": 1.5, "lateral": .9, "brow": 6.0, "orbit": 8.0,
    "nasalBridge": 7., "nasalTip": 10., "midface": 3.,
    "cheek": 2.3, "upperLip": 9., "lowerLip": 9.,
    "chin": 3.5, "jaw": 2., "ear": 10.,
}


def base_name(region):
    return region[:-2] if region.endswith(("_L", "_R")) else region


def edges_of(tri):
    return ((min(int(tri[0]), int(tri[1])), max(int(tri[0]), int(tri[1]))),
            (min(int(tri[1]), int(tri[2])), max(int(tri[1]), int(tri[2]))),
            (min(int(tri[2]), int(tri[0])), max(int(tri[2]), int(tri[0]))))


def topology_edges(faces, live=None):
    usage = defaultdict(list)
    for fid, tri in enumerate(faces):
        if live is not None and not live[fid]:
            continue
        for e in edges_of(tri):
            usage[e].append(fid)
    return usage


def normals_and_planes(v, f):
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    n = np.cross(b - a, c - a)
    length = np.linalg.norm(n, axis=1)
    n = n / np.maximum(length[:, None], 1e-20)
    p = np.column_stack((n, -np.einsum("ij,ij->i", n, a)))
    return n, p, length


class RegionQEM:
    def __init__(self, vertices, faces, face_regions, region_names, source_protected=None):
        self.v = vertices.copy()
        self.f = faces.copy()
        self.labels = np.array(face_regions, dtype=np.int32)
        self.names = region_names
        self.live_f = np.ones(len(faces), dtype=bool)
        self.live_v = np.zeros(len(vertices), dtype=bool)
        self.live_v[np.unique(faces)] = True
        self.inc = [set() for _ in vertices]
        for i, tri in enumerate(faces):
            for vid in tri:
                self.inc[int(vid)].add(i)
        self.by_region = np.bincount(self.labels, minlength=len(region_names)).astype(int)
        self.minimum = np.array([
            max(1, int(np.floor(self.by_region[i] * MIN_RETAIN.get(base_name(name), .4))))
            for i, name in enumerate(region_names)
        ], dtype=int)
        self.locked, self.lock_reasons = self.feature_locks(source_protected)
        usage = topology_edges(self.f)
        self.immutable_edges = {e for e, owners in usage.items()
                                if len(owners) == 2 and self.labels[owners[0]] != self.labels[owners[1]]}
        self.immutable_edges.update(e for e in usage if self.v[e[0], 0] == 0 and self.v[e[1], 0] == 0)
        self.q = np.zeros((len(vertices), 4, 4), dtype=np.float64)
        self.version = np.zeros(len(vertices), dtype=np.int64)
        self.serial = 0
        self.heap = []
        self.stats = Counter()
        self.initialize_quadrics()
        self.initialize_heap()

    def feature_locks(self, source_protected):
        edge_owner = topology_edges(self.f)
        fixed = set(int(i) for i in np.flatnonzero(self.v[:, 0] == 0))
        counts = {"plane": len(fixed)}
        boundaries = [e for e, fs in edge_owner.items()
                      if len(fs) == 2 and self.labels[fs[0]] != self.labels[fs[1]]]
        fixed.update(x for e in boundaries for x in e)
        counts["shared_region_edges"] = len(boundaries)
        counts["shared_region_vertices"] = len(fixed)
        # Geometric creases form recognizable ears, eyelids, nostrils, lip seam.
        normals, _, _ = normals_and_planes(self.v, self.f)
        crease_count = 0
        for edge, fs in edge_owner.items():
            if len(fs) != 2:
                continue
            a, b = fs
            dot = float(np.dot(normals[a], normals[b]))
            label_a, label_b = self.names[self.labels[a]], self.names[self.labels[b]]
            area = (base_name(label_a), base_name(label_b))
            cutoff = .84 if any(x in (
                "orbit", "brow", "nasalTip", "nasalBridge", "upperLip",
                "lowerLip", "ear", "chin") for x in area) else .48
            if dot < cutoff:
                fixed.update(edge)
                crease_count += 1
        counts["crease_edges"] = crease_count
        # Boundaries of high-detail eye/ear/nose/mouth patches are actual
        # source openings. Restrict pinning to high-curvature corners and
        # extremal silhouettes rather than every preexisting source open edge.
        for i, name in enumerate(self.names):
            base = base_name(name)
            if base not in ("orbit", "brow", "nasalTip", "nasalBridge",
                            "upperLip", "lowerLip", "ear", "chin"):
                continue
            verts = np.unique(self.f[np.flatnonzero(self.labels == i)])
            if not len(verts):
                continue
            coords = self.v[verts]
            if base == "ear":
                extremum = np.abs(coords[:, 0])
            else:
                extremum = coords[:, 2]
            threshold = np.percentile(extremum, 90 if base == "ear" else 94)
            fixed.update(int(x) for x in verts[extremum >= threshold])
        counts["total_immutable_vertices"] = len(fixed)
        return fixed, counts

    def initialize_quadrics(self):
        face_normals, planes, areas = normals_and_planes(self.v, self.f)
        # Area weighting avoids tiny triangles dominating the smooth cranium.
        weight = np.sqrt(np.maximum(areas, 1e-9))
        qm = np.einsum("ni,nj,n->nij", planes, planes, weight)
        for corner in range(3):
            np.add.at(self.q, self.f[:, corner], qm)
        # Extra boundary planes discourage the characteristic silhouette
        # pinching of ordinary QEM on an open triangle mesh.
        usage = topology_edges(self.f)
        for (a, b), fs in usage.items():
            if len(fs) != 1:
                continue
            fid = fs[0]
            edge = self.v[b] - self.v[a]
            n = np.cross(edge, face_normals[fid])
            norm = float(np.linalg.norm(n))
            if norm <= 1e-12:
                continue
            n /= norm
            p = np.array([*n, -float(np.dot(n, self.v[a]))])
            base = base_name(self.names[self.labels[fid]])
            factor = 18. if base in ("ear", "orbit", "brow", "nasalTip", "upperLip", "lowerLip") else 4.
            weight = factor * np.linalg.norm(edge)
            self.q[a] += weight * np.outer(p, p)
            self.q[b] += weight * np.outer(p, p)

    def neighbors(self, u):
        s = set()
        for fid in self.inc[u]:
            if self.live_f[fid]:
                s.update(int(x) for x in self.f[fid] if x != u)
        return s

    def proposed(self, a, b):
        if not self.live_v[a] or not self.live_v[b] or (a in self.locked and b in self.locked):
            return None
        if b in self.locked:
            a, b = b, a
        if a not in self.locked and b not in self.locked:
            q = self.q[a] + self.q[b]
            pa = np.r_[self.v[a], 1.]
            pb = np.r_[self.v[b], 1.]
            ca = max(0., float(pa @ q @ pa))
            cb = max(0., float(pb @ q @ pb))
            if cb < ca:
                a, b, ca = b, a, cb
            cost = ca
        else:
            q = self.q[a] + self.q[b]
            pa = np.r_[self.v[a], 1.]
            cost = max(0., float(pa @ q @ pa))
        common_faces = self.inc[a] & self.inc[b]
        if not common_faces or len(common_faces) > 2:
            return None
        label_ids = {int(self.labels[f]) for f in common_faces}
        if len(label_ids) != 1:
            return None
        region = next(iter(label_ids))
        cost *= PRIORITY.get(base_name(self.names[region]), 3.)
        return cost, a, b

    def push(self, a, b):
        if a == b:
            return
        if a > b:
            a, b = b, a
        p = self.proposed(a, b)
        if p is None:
            return
        score, keep, drop = p
        self.serial += 1
        heapq.heappush(self.heap,
                       (score, self.serial, keep, drop, self.version[keep], self.version[drop]))

    def initialize_heap(self):
        for edge in topology_edges(self.f):
            self.push(*edge)

    def can_collapse(self, keep, drop):
        shared = self.inc[keep] & self.inc[drop]
        if len(shared) not in (1, 2):
            return False, "edge_incidence", None
        region = int(self.labels[next(iter(shared))])
        # Even when the collapsing vertex is free, removing its adjacent
        # triangle must not erase an immutable seam or semantic boundary.
        if any(edge in self.immutable_edges for fid in shared
               for edge in edges_of(self.f[fid])):
            return False, 'protected_edge_face', None
        if any(self.labels[f] != region for f in shared):
            return False, "mixed_region", None
        if self.by_region[region] - len(shared) < self.minimum[region]:
            return False, "region_budget", None
        # Exact link condition: no vertex merge, bow-tie or nonmanifold edge.
        common = self.neighbors(keep) & self.neighbors(drop)
        opposite = {int(x) for fid in shared for x in self.f[fid]
                    if x != keep and x != drop}
        if common != opposite:
            return False, "link_condition", None
        affected = self.inc[drop] - shared
        if not affected:
            return False, "island_deletion", None
        for fid in affected:
            tri = self.f[fid]
            replaced = np.where(tri == drop, keep, tri)
            if len(set(replaced.tolist())) != 3:
                return False, "collapsed_triangle", None
            a, b, c = self.v[tri]
            aa, bb, cc = self.v[replaced]
            before = np.cross(b-a, c-a)
            after = np.cross(bb-aa, cc-aa)
            sq_before = float(np.dot(before, before))
            sq_after = float(np.dot(after, after))
            if sq_after < 1e-14 or sq_after < .055 * sq_before:
                return False, "small_area", None
            cosine = float(np.dot(before, after) /
                           np.sqrt(max(sq_before * sq_after, 1e-30)))
            if cosine < .50:
                return False, "normal_flip", None
        return True, "ok", region

    def collapse(self, keep, drop, region):
        touched = set(self.neighbors(keep)) | set(self.neighbors(drop)) | {keep}
        old_faces = list(self.inc[drop])
        for fid in old_faces:
            old_tri = self.f[fid].copy()
            for x in old_tri:
                self.inc[int(x)].discard(fid)
            if keep in old_tri:
                self.live_f[fid] = False
                self.by_region[int(self.labels[fid])] -= 1
            else:
                self.f[fid] = np.where(old_tri == drop, keep, old_tri)
                for x in self.f[fid]:
                    self.inc[int(x)].add(fid)
        self.live_v[drop] = False
        self.q[keep] += self.q[drop]
        self.version[drop] += 1
        self.version[keep] += 1
        # Only the one-ring around 'keep' changed. Other candidates remain
        # current until their endpoint quadrics change.
        for neighbor in touched | self.neighbors(keep):
            if neighbor != keep and self.live_v[neighbor]:
                self.push(keep, neighbor)
        self.stats["collapses"] += 1

    def simplify(self, target_left=5000):
        while self.heap and int(self.live_f.sum()) > target_left:
            score, _, keep, drop, vkeep, vdrop = heapq.heappop(self.heap)
            if (not self.live_v[keep] or not self.live_v[drop]
                    or self.version[keep] != vkeep or self.version[drop] != vdrop):
                self.stats["stale"] += 1
                continue
            valid, reason, region = self.can_collapse(keep, drop)
            if not valid:
                self.stats[reason] += 1
                continue
            self.collapse(keep, drop, region)
        self.stats["remaining_left_faces"] = int(self.live_f.sum())
        self.stats["reached_goal"] = bool(int(self.live_f.sum()) <= target_left)
        return self.f[self.live_f], self.labels[self.live_f]


def main():
    scene = trimesh.load(SOURCE, force="scene", process=False)
    master = scene.to_geometry() if hasattr(scene, "to_geometry") else scene.dump(concatenate=True)
    source_v = np.asarray(master.vertices, dtype=np.float64)
    source_normals = np.asarray(master.vertex_normals, dtype=np.float64)
    source_f = np.asarray(master.faces, dtype=np.int64)
    manifest = json.loads(MAP.read_text(encoding="utf8"))
    assert len(source_f) == 34500 and len(source_v) == 31357

    source_tags = np.full(len(source_f), -1, dtype=np.int32)
    for region, group in enumerate(manifest["groups"]):
        source_tags[group["faceIds"]] = region
    assert (source_tags >= 0).all()
    face_mid_x = source_v[source_f, 0].mean(axis=1)
    left = face_mid_x < -1e-12
    right = face_mid_x > 1e-12
    assert int(left.sum()) == int(right.sum()) == 17250
    assert np.all(source_v[source_f[left], 0] <= 1e-8)
    region_names = [group["id"] for group in manifest["groups"]]
    assert not any(region_names[r].endswith("_R") for r in source_tags[left])

    # No reconstruction: start from original positions and faces. Each surviving
    # vertex has its original source index; no vertices are synthesized.
    simplifier = RegionQEM(source_v, source_f[left], source_tags[left], region_names)
    left_faces, left_regions = simplifier.simplify(5000)

    # Preserve exact source-indexed cross-region edges before reflection.
    before_edge = topology_edges(source_f[left])
    after_edge = topology_edges(left_faces)
    def shared(owners, tags):
        return {e for e, fs in owners.items()
                if len(fs) == 2 and tags[fs[0]] != tags[fs[1]]}
    input_shared = shared(before_edge, source_tags[left])
    output_shared = shared(after_edge, left_regions)
    assert input_shared == output_shared, (
        "Source part border moved: lost=%d new=%d" %
        (len(input_shared - output_shared), len(output_shared - input_shared))
    )
    input_seam = {e for e in before_edge
                  if source_v[e[0], 0] == 0 and source_v[e[1], 0] == 0}
    output_seam = {e for e in after_edge
                   if source_v[e[0], 0] == 0 and source_v[e[1], 0] == 0}
    assert input_seam == output_seam, "X=0 seam was altered"
    assert not any(len(fs) > 2 for fs in after_edge.values()), "New nonmanifold left edge"

    used = np.unique(left_faces)
    old_to_new = np.full(len(source_v), -1, dtype=np.int64)
    old_to_new[used] = np.arange(len(used), dtype=np.int64)
    verts = source_v[used].copy()
    norms = source_normals[used].copy()
    off_seam = np.flatnonzero(verts[:, 0] != 0.)
    twin = np.arange(len(used), dtype=np.int64)
    twin[off_seam] = np.arange(len(used), len(used)+len(off_seam))
    right_v = verts[off_seam].copy()
    right_v[:, 0] *= -1
    right_n = norms[off_seam].copy()
    right_n[:, 0] *= -1
    full_v = np.vstack((verts, right_v)).astype(np.float32)
    full_n = np.vstack((norms, right_n)).astype(np.float32)
    lf = old_to_new[left_faces]
    rf = twin[lf[:, [0, 2, 1]]]
    full_f = np.vstack((lf, rf)).astype(np.int64)

    mirror_region = [region_names.index(n[:-2] + "_R") if n.endswith("_L")
                     else region_names.index(n) for n in region_names]
    right_regions = np.array([mirror_region[r] for r in left_regions], dtype=int)
    full_tags = np.hstack((left_regions, right_regions))
    assert np.all(np.isfinite(full_v))
    assert full_f.max() < len(full_v) and full_f.min() >= 0
    assert (full_f[:, 0] != full_f[:, 1]).all()
    assert (full_f[:, 1] != full_f[:, 2]).all()
    assert (full_f[:, 0] != full_f[:, 2]).all()
    assert len(set(map(tuple, np.sort(full_f, axis=1)))) == len(full_f)
    assert len(full_f) == len(lf)*2

    final_edges = topology_edges(full_f)
    seam_usage = {e:len(fs) for e, fs in final_edges.items()
                  if full_v[e[0], 0] == 0 and full_v[e[1], 0] == 0}
    assert len(seam_usage) == len(input_seam)
    assert all(x == 2 for x in seam_usage.values()), "Central mirror seam split"
    assert not any(len(fs)>2 for fs in final_edges.values()), "New nonmanifold edge"

    out = trimesh.Trimesh(vertices=full_v, faces=full_f,
                          vertex_normals=full_n, process=False)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.export(OUT)

    part_scene = trimesh.Scene()
    part_json = {"schema": "roomboy.head-region-lod.v1",
                 "source": SOURCE.name, "unified": OUT.name,
                 "continuousTopologySource": "single unified shared global index array",
                 "groups": []}
    for rid, group in enumerate(manifest["groups"]):
        fids = np.flatnonzero(full_tags == rid)
        local = full_f[fids]
        if not len(local):
            continue
        gids, inverse = np.unique(local, return_inverse=True)
        faces = inverse.reshape(-1,3)
        part = trimesh.Trimesh(vertices=full_v[gids], faces=faces,
                               vertex_normals=full_n[gids], process=False)
        part_scene.add_geometry(part, node_name=group["id"], geom_name=group["id"])
        part_json["groups"].append({
            "id": group["id"], "family": group["family"], "faces": len(local),
            "globalVertexIds": gids.tolist(),
            "sourceVertexIds": [
                int(used[x]) if x < len(used) else -int(used[off_seam[x-len(used)]])-1
                for x in gids],
        })
    assert len(part_json["groups"]) == 23
    PART_OUT.write_bytes(part_scene.export(file_type="glb"))
    MANIFEST_OUT.write_text(json.dumps(part_json, separators=(",", ":")) + "\n", encoding="utf8")

    stats = {
        "schema": "roomboy.head-region-lod-report.v1",
        "state": "accepted_geometry_candidate" if len(full_f) <= 10000 else "unaccepted_first_round_over_budget",
        "source": SOURCE.name, "sourceFaces": len(source_f),
        "outputFaces": len(full_f), "outputVertices": len(full_v),
        "targetFaces": 10000, "reductionPercent": round(100*(1-len(full_f)/len(source_f)), 3),
        "isExactMirroredIndexedMesh": True, "sourceOnlyGeometry": True,
        "crossRegionBoundaryEdgesUnchangedOnLeft": len(input_shared),
        "centerPlaneEdgesFullyWelded": len(seam_usage),
        "baselineSourceOpenEdgesOnLeft": sum(len(x)==1 for x in before_edge.values()),
        "candidateOpenEdgesOnLeft": sum(len(x)==1 for x in after_edge.values()),
        "newNonManifoldEdges": 0, "sourceEdgesPreserved": "region interfaces and X=0; source open-edge loops may simplify",
        "landmarkLocks": simplifier.lock_reasons,
        "collapser": dict(simplifier.stats),
        "regions": [{
            "id": name,
            "sourceLeftFaces": int(np.count_nonzero(source_tags[left] == idx)),
            "candidateLeftFaces": int(np.count_nonzero(left_regions == idx)),
            "minimumAllowed": int(simplifier.minimum[idx]),
        } for idx, name in enumerate(region_names) if np.count_nonzero(source_tags[left] == idx)],
        "acceptance": {
            "countAtMost10000": len(full_f)<=10000,
            "sourceUnmodified": True,
            "mirrorAndCenterSeam": True,
            "regionBordersExact": True,
            "visualInspection": "pending image review",
        },
        "notice": "This is a constrained diagnostic candidate, not an accepted replacement for the 34.5K master.",
    }
    REPORT_OUT.write_text(json.dumps(stats, ensure_ascii=False, indent=2)+"\n",encoding="utf8")
    print(json.dumps({key:stats[key] for key in (
        "state","sourceFaces","outputFaces","outputVertices","reductionPercent",
        "crossRegionBoundaryEdgesUnchangedOnLeft","centerPlaneEdgesFullyWelded",
        "baselineSourceOpenEdgesOnLeft","candidateOpenEdgesOnLeft","collapser")}, indent=2))


if __name__=="__main__":
    main()
