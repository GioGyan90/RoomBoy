# Cruise cabin — low-poly asset rebuild plan

## Art direction
Source of truth: user's cutaway black-and-gold cruise suite concept (November 2026).
Reject stock-like high-poly rendering. The production language is clean stylized
anime/game low-poly with readable bevels, deliberate negative space, warm brass,
walnut, dark marble, and folded ivory linen.

## Staged implementation
1. **Round 1 — structural asset kit (in progress):** author reusable mesh
   primitives, proper mesh holes for ship windows, low-poly draped duvet/runner,
   UV regions, and geometry tests. Preserve dimensions and existing navigation.
2. **Round 2 — architectural booleans:** rebuild the starboard hull as
   parametrically cut shell segments / CSG-generated door and window holes;
   integrate doorway reveal, gaskets, metal rims, transoms, exterior plate
   and adjacent balustrade into one assembly; verify from exterior cameras.
   A hollow decorative frame alone is not a wall Boolean.
3. **Round 3 — furniture modeling:** replace primitive wardrobe/mini-bar panels
   with recessed inlaid doors, boolean-cut drawers and cabinet voids; sculpt
   chair/sofa cushion shells, oval ceramic lavatory, and bath.
4. **Round 4 — texture atlas + final assembly:** UV unwrap all meshes into a
   1024² or 2048² packed atlas, implement stylized color ramps and surface
   directions; test WebGL memory, LOD, shadows and all 12+ camera views.

## UV proposal (v1)
A 1024×1024 atlas is reserved for stylized trim and tiling rather than
photorealistic materials. Coordinates are normalized [0,1] and stable.
Top row V [.5,1]: U [0,.5] ivory fabric, U [.5,1] ink navy fabric.
Bottom row V [0,.5]: U [0,.25] walnut grain, [.25,.5] black marble,
[.5,.75] muted brass, [.75,1] ivory ceramic.
Cloth mesh uses planar UV generated per grid vertex. For final cloth, UV islands
will place top, side hems, underside independently to avoid stretching.
Woodgrain should follow the long axis of cabinets. Metal seams can share
solid palettes to save pixels, with bevel highlights painted only where useful.

## Geometric rules
- Physical apertures and insets, not colored plates laid over closed walls.
- Separate shell thickness, reveal, gasket, frame, glass, curtain and guardrail.
- Bulky bedding must have an upper drape, lower hem and non-planar folds.
- Do not subtract every overlapping pair; some overlaps are required to seat
  upholstery and cabinetry. Test only semantically unrelated parts.
- Preserve public API, named scene objects and RoomLayout interaction anchors.

## Validation
Run `npm test` and `npm run build`. CI visual review captures overview,
bed, bath, ocean, top, table, toilet, side, bed-left, bed-right, service-bar,
and balcony-door. Round 2 exterior quality gates use eight new cameras: exterior-starboard,
exterior-window-front, exterior-window-oblique, exterior-window-low,
exterior-door-front, exterior-door-jamb, exterior-hull-top, exterior-entry.
All 20 frames must be captured, with successful browser console checks.
Use real screenshots to check frame corners, sill, gasket, shell lip and metal
ribbons; geometry tests cover through-wall contact and non-obstructed glazing.
