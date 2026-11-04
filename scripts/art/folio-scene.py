"""Original Folio de trayectorias geometry for Higgsfield 3D Jutsu (Blender 5.2).
Execute in the project's supported scene_builder_3d_run_python runtime.
No external files/textures or network are required. Four static shape-key poses.
"""
import bpy, math
from mathutils import Vector
scene = bpy.context.scene
# This build is exclusively for the new, empty folio project.
if len(bpy.data.objects):
    raise RuntimeError('Build requires the inspected empty folio project')
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1600
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.media_type = 'IMAGE'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.world = bpy.data.worlds.new('WORLD_studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.20,0.24,0.32,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.3

def linear(c):
    return c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4

def material(name, rgb, metallic, roughness):
    m=bpy.data.materials.new(name); m.use_nodes=True
    color=tuple(linear(c/255) for c in rgb)+(1,)
    m.diffuse_color=color
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=color
    p.inputs['Metallic'].default_value=metallic
    p.inputs['Roughness'].default_value=roughness
    return m
blue=material('MAT_folio_blue_3b82f6',(59,130,246),.36,.29)
edge=material('MAT_folio_edge_90c0ff',(144,192,255),.3,.34)
root=bpy.data.objects.new('HERO_folio',None); scene.collection.objects.link(root)
PHASES={'matter':(.38,.65,.10),'trajectory':(1.12,1.20,.85),'weave':(1.38,1.34,1.10),'constellation':(1.65,1.48,1.30)}
# Each sheet grows from a narrow binding into a broad calligraphic surface.
# Four leaves on either side have individually staggered shoulders and ends.
heights=[3.24,3.66,3.80,3.38,3.06,3.55,3.91,3.58]

def point(i,t,u,phase):
    opening,depth,twist=PHASES[phase]
    side=-1 if i<4 else 1
    j=i%4
    arc=math.sin(math.pi*t*.81)
    width=(.035+(.50+.40*opening)*math.sin(math.pi*t*.52))
    radial=.065+opening*arc+j*.14*t
    x=side*(radial+u*width)
    y=(j-1.5)*.38*(.16+.84*t)*depth + .20*math.sin(math.pi*t) + u*twist*math.sin(math.pi*t*.8) + .15*math.sin(math.pi*t)*math.sin(4*u+4*t) + .85*u*u*math.sin(math.pi*t*.7)
    z=-1.85 + heights[i]*t + u*.42*t - .12*math.sin(math.pi*t) - .16*(2*u)**4*t**8
    return Vector((x,y,z))

def normal(i,t,u,phase):
    eps=.0001
    a=point(i,t+eps,u,phase)-point(i,t-eps,u,phase)
    b=point(i,t,u+eps,phase)-point(i,t,u-eps,phase)
    return a.cross(b).normalized()

NT,NU=48,10
for i in range(8):
    vertices=[]; faces=[]
    for side in [-1,1]:
        for a in range(NT+1):
            t=a/NT
            for b in range(NU+1):
                u=b/NU-.5
                vertices.append(point(i,t,u,'trajectory')+normal(i,t,u,'trajectory')*(side*.009))
    layer=(NT+1)*(NU+1)
    for a in range(NT):
        for b in range(NU):
            v=a*(NU+1)+b
            faces.append((v,v+1,v+NU+2,v+NU+1))
            faces.append(tuple(vv+layer for vv in (v+NU+1,v+NU+2,v+1,v)))
    boundary=[b for b in range(NU+1)]+[a*(NU+1)+NU for a in range(1,NT+1)]+[NT*(NU+1)+b for b in range(NU-1,-1,-1)]+[a*(NU+1) for a in range(NT-1,0,-1)]
    for j,v in enumerate(boundary):
        w=boundary[(j+1)%len(boundary)]
        faces.append((v+layer,w+layer,w,v))
    mesh=bpy.data.meshes.new('MESH_leaf_%02d'%(i+1)); mesh.from_pydata(vertices,[],faces); mesh.update()
    o=bpy.data.objects.new('HERO_leaf_%02d'%(i+1),mesh); scene.collection.objects.link(o); o.parent=root
    mesh.materials.append(blue); mesh.materials.append(edge)
    for p in mesh.polygons:
        p.use_smooth=p.index < NT*NU*2
        if p.index >= NT*NU*2: p.material_index=1
    o.shape_key_add(name='Basis')
    for phase in PHASES:
        k=o.shape_key_add(name=phase)
        n=0
        for side in [-1,1]:
            for a in range(NT+1):
                for b in range(NU+1):
                    t=a/NT;u=b/NU-.5
                    k.data[n].co=point(i,t,u,phase)+normal(i,t,u,phase)*(side*.009);n+=1
    o['leaf_number']=i+1
    o['construction']='Closed thin sheet, hand-composed sweep; four related static poses'
# Three fitted route inlays per leaf; editable meshes, same shape-key topology.
route=material('MAT_route_blue_90c0ff',(144,192,255),.18,.4)
for i in range(8):
    front=1 if i<4 else -1
    for line in range(3):
        def route_point(t,edge,phase):
            u=-.29+line*.235+.07*math.sin(math.pi*t*1.5+line*.6)*math.sin(math.pi*t)+edge*.0022
            return point(i,t,u,phase)+normal(i,t,u,phase)*(front*.014)
        coords=[]; faces=[]
        for a in range(41):
            t=.16+a/40*(.76-.035*line)
            coords.extend([route_point(t,-1,'trajectory'),route_point(t,1,'trajectory')])
        for a in range(40):faces.append((2*a,2*a+1,2*a+3,2*a+2))
        mesh=bpy.data.meshes.new('MESH_route_%02d_%d'%(i+1,line+1));mesh.from_pydata(coords,[],faces);mesh.update()
        o=bpy.data.objects.new('PRP_route_%02d_%d'%(i+1,line+1),mesh);scene.collection.objects.link(o);o.parent=root
        mesh.materials.append(route)
        for p in mesh.polygons:p.use_smooth=True
        o.shape_key_add(name='Basis')
        for phase in PHASES:
            k=o.shape_key_add(name=phase)
            for a in range(41):
                t=.16+a/40*(.76-.035*line)
                k.data[a*2].co=route_point(t,-1,phase);k.data[a*2+1].co=route_point(t,1,phase)
        o['construction']='Surface-fitted blue route inlay, decorative editorial mark'
# Shared binding joins the eight tapered feet, with an intentional compact collar.
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(0,0,-1.85))
junction=bpy.context.object;junction.name='PRP_shared_junction';junction.scale=(.14,.18,.045);junction.parent=root
junction.data.materials.append(blue)
for p in junction.data.polygons:p.use_smooth=True
camdata=bpy.data.cameras.new('CAM_main');cam=bpy.data.objects.new('CAM_main',camdata);scene.collection.objects.link(cam)
cam.location=(6.36,-8.76,3.5);target=Vector((.36,.24,.08));cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler()
camdata.type='ORTHO';camdata.ortho_scale=7.5;scene.camera=cam

def light(name,kind,loc,power,radius,color):
    d=bpy.data.lights.new(name,kind);d.energy=power;d.color=color
    if kind=='POINT':d.shadow_soft_size=radius
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector((0,0,0))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
    return o
light('LGT_key','POINT',(-3.5,-2.5,5.5),2200,2.2,(.84,.91,1))
light('LGT_fill','POINT',(4,-4,1.5),550,3.5,(.28,.53,1))
scene['folio_phases']='matter,trajectory,weave,constellation'
scene['folio_revision_intent']='06 delivery framing, rolled-sheet depth, four static poses'
target=artifacts.file(name='trajectory-desktop.png',media_type='image/png')
scene.render.filepath=str(target.path);bpy.ops.render.render(write_still=True);target.publish()
result={'objects':len(bpy.data.objects),'leaf_count':8,'vertices':sum(len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'),'camera':cam.name,'phase':'trajectory'}
