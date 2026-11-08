import * as T from 'three';
/** Thin, selective contour lines instead of outlining every decorative seam. */
export function applyCruiseInk(root:T.Group){
 const ink=new T.LineBasicMaterial({color:0x30232c,transparent:true,opacity:.76,depthWrite:false});
 const key=/king-bed-frame|pillowtop-mattress|quilt-ivory|headboard-wood-frame|walnut-nightstand|full-height-wardrobe|sofa-seat-frame|sofa-curved-backrest|sofa-arm|sofa-seat-cushion|cocktail-table-marble|cocktail-table-pedestal|toilet-bowl|toilet-cistern|tub-side-wall|tub-end-wall|vanity-cabinet|minibar-cabinet|ship-hull-foundation|bath-divider|bath-rear-wall/;
 const targets:T.Mesh[]=[];
 root.traverse(o=>{if(o instanceof T.Mesh&&key.test(o.name))targets.push(o);});
 for(const mesh of targets){
  const edges=new T.EdgesGeometry(mesh.geometry,35);
  const lines=new T.LineSegments(edges,ink);
  lines.name='manga-contour-'+mesh.name;
  lines.renderOrder=3;
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  lines.scale.copy(mesh.scale);
  mesh.parent?.add(lines);
 }
}
