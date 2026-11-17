#!/usr/bin/env python3
"""CPU orthographic geometry review snapshots: 34.5K original vs real QEM LOD.

Does not require a browser, GPU, or any replacement surface. Generates four
matched camera renders and zoom crops, plus measurable silhouette IoU.
"""
import json
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFont

ROOT=Path("public/heads")
ORIGINAL=ROOT/"grey-head-qem-symmetric.glb"
CANDIDATE=ROOT/"grey-head-region-lod-v1.glb"
REPORT=ROOT/"grey-head-region-lod-v1.report.json"
OUT=Path("docs/images/head-region-lod-v1")
OUT.mkdir(parents=True,exist_ok=True)
VIEWS={
    "front": ((0,0,1), (1,0,0)),
    "quarter": ((.707106781,0,.707106781), (.707106781,0,-.707106781)),
    "side": ((1,0,0), (0,0,-1)),
    "back": ((0,0,-1), (-1,0,0)),
}
BG=(236,239,236)
LIGHT=np.array([.35,.55,.77])
LIGHT/=np.linalg.norm(LIGHT)


def load(path):
    s=trimesh.load(path,force="scene",process=False)
    m=s.to_geometry() if hasattr(s,"to_geometry") else s.dump(concatenate=True)
    return np.asarray(m.vertices),np.asarray(m.faces)


def draw_mesh(verts,faces,look,right,size=(590,660),scale=250,focus=(0,0,0),wire=False):
    width,height=size
    look=np.asarray(look,dtype=float)
    right=np.asarray(right,dtype=float)
    up=np.array([0.,1.,0.])
    center=np.asarray(focus,dtype=float)
    proj=np.stack(((verts-center)@right,(verts-center)@up,(verts-center)@look),axis=1)
    xy=np.stack((width*.5+proj[:,0]*scale,height*.5-proj[:,1]*scale),axis=1)
    depth=np.mean(proj[faces,2],axis=1)
    order=np.argsort(depth,kind="stable")
    face_verts=verts[faces]
    normals=np.cross(face_verts[:,1]-face_verts[:,0],face_verts[:,2]-face_verts[:,0])
    length=np.linalg.norm(normals,axis=1)
    normals/=np.maximum(length[:,None],1e-20)
    brightness=np.clip(.48+.28*(normals@LIGHT),.22,.83)
    im=Image.new("RGB",size,BG)
    dr=ImageDraw.Draw(im)
    for fid in order:
        p=xy[faces[fid]]
        if np.max(p[:,0])<0 or np.min(p[:,0])>width or np.max(p[:,1])<0 or np.min(p[:,1])>height:
            continue
        tone=int(255*brightness[fid])
        color=(tone+10,tone+12,tone+12)
        dr.polygon([tuple(x) for x in p.tolist()],fill=color)
        if wire:
            dr.line([tuple(x) for x in p.tolist()]+[tuple(p[0])],fill=(90,109,115),width=1)
    return im


def silhouette(verts,faces,look,right,size=(590,660),scale=250,focus=(0,0,0)):
    width,height=size
    proj=np.stack(((verts-np.asarray(focus))@np.asarray(right),
                   (verts-np.asarray(focus))@np.array([0.,1.,0.])),axis=1)
    xy=np.stack((width*.5+proj[:,0]*scale,height*.5-proj[:,1]*scale),axis=1)
    im=Image.new("1",size,0)
    draw=ImageDraw.Draw(im)
    for tri in faces:
        draw.polygon([tuple(x) for x in xy[tri].tolist()], fill=1)
    return np.asarray(im,dtype=bool)


def paste_title(image,text,x):
    dr=ImageDraw.Draw(image)
    dr.text((x+18,12),text,fill=(31,52,61))


def main():
    original=load(ORIGINAL)
    candidate=load(CANDIDATE)
    result={}
    for name,(look,right) in VIEWS.items():
        left=draw_mesh(*original,look,right)
        right_img=draw_mesh(*candidate,look,right)
        compare=Image.new("RGB",(1200,700),(245,246,244))
        compare.paste(left,(6,34))
        compare.paste(right_img,(604,34))
        paste_title(compare,"SOURCE / 34,500 triangles",6)
        paste_title(compare,"REGION QEM / candidate",604)
        filename=f"{name}-comparison.png"
        compare.save(OUT/filename,optimize=True)
        m1=silhouette(*original,look,right)
        m2=silhouette(*candidate,look,right)
        union=int(np.logical_or(m1,m2).sum())
        intersection=int(np.logical_and(m1,m2).sum())
        result[name]={"image":f"docs/images/head-region-lod-v1/{filename}",
                      "silhouetteIoU":round(intersection/max(union,1),6)}
    # Forward feature crop uses source-space same camera and world bounding
    # ranges for both models. This is a geometry crop, not an enlarged screenshot.
    left=draw_mesh(*original,*VIEWS["front"],size=(650,650),scale=475,focus=(0,-.18,.25),wire=True)
    right=draw_mesh(*candidate,*VIEWS["front"],size=(650,650),scale=475,focus=(0,-.18,.25),wire=True)
    detail=Image.new("RGB",(1320,690),(245,246,244))
    detail.paste(left,(5,34))
    detail.paste(right,(665,34))
    paste_title(detail,"SOURCE / face wire",5)
    paste_title(detail,"REGION QEM / face wire",665)
    detail.save(OUT/"face-wire-comparison.png",optimize=True)
    m1=silhouette(*original,*VIEWS["front"],size=(650,650),scale=475,focus=(0,-.18,.25))
    m2=silhouette(*candidate,*VIEWS["front"],size=(650,650),scale=475,focus=(0,-.18,.25))
    result["face_wire"]={"image":"docs/images/head-region-lod-v1/face-wire-comparison.png",
      "silhouetteIoU":round(int(np.logical_and(m1,m2).sum())/max(int(np.logical_or(m1,m2).sum()),1),6)}
    report=json.loads(REPORT.read_text(encoding="utf8"))
    report["renderReview"]=result
    report["acceptance"]["silhouettePassed"]=all(x["silhouetteIoU"]>=.94 for x in result.values())
    if not report["acceptance"]["silhouettePassed"]:
        report["state"]="unaccepted_silhouette_deviation"
    report["acceptance"]["visualInspection"]="five actual-source matched geometry renders generated; automatic silhouette check; human image inspection still required"
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(result,indent=2))


if __name__=="__main__":
    main()
