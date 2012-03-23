var puppet = (function() {
  var exports = {};

  exports.extractMaterials = function(voxels) {
    var i2m = [], m2i = {}, indices = [];
    for (var i = 3; i < voxels.length; i += 4) {
      var fragment = voxels[i], index = m2i[fragment];
      if (index === undefined) {
        index = m2i[fragment] = i2m.length;

        var color = new THREE.Color(fragment);
        i2m.push({
          DbgColor: fragment,
          DbgIndex: index,
          DbgName: "Material" + index,
          colorAmbient : [0, 0, 0],
          colorDiffuse : [color.r, color.g, color.b],
          colorSpecular : [0.5, 0.5, 0.5],
          shading: "Lambert",
          specularCoef: 50
        });
      }
      indices.push(index);
    }
    return {
      indices: indices,
      materials: i2m
    };
  };

  exports.triangulateSingleVoxel = function(x, y, z) {
    var vertices = [
          x +  0.5, y + -0.5, z + -0.5,
          x +  0.5, y + -0.5, z +  0.5,
          x + -0.5, y + -0.5, z +  0.5,
          x + -0.5, y + -0.5, z + -0.5,
          x +  0.5, y +  0.5, z + -0.5,
          x +  0.5, y +  0.5, z +  0.5,
          x + -0.5, y +  0.5, z +  0.5,
          x + -0.5, y +  0.5, z + -0.5
        ],
        faces = [
          0,1,2,3,
          4,7,6,5,
          0,4,5,1,
          1,5,6,2,
          2,6,7,3,
          4,0,3,7
        ];

    return _.reduce(faces, function(ret, f) {
      var f3 = f * 3;
      ret.push(vertices[f3], vertices[f3 + 1], vertices[f3 + 2]);
      return ret;
    }, []);
  };

  exports.triangulateVoxels = function(voxels) {
    var vertices = [];
    for (var i = 0; i < voxels.length; i += 4) {
      Array.prototype.push.apply(
        vertices,
        exports.triangulateSingleVoxel(
          voxels[4 * i],
          voxels[4 * i + 1],
          voxels[4 * i + 2]
        )
      );
    }
    return vertices;
  };

  exports.uniqueVertices = function(vertices, materials) {
    var i2v = [], // index -> vertex
        v2i = {}, // vertex -> index
        faces = [];

    for (var i = 0; i < vertices.length / 3; ++i) {
      var vertex = vertices.slice(i * 3, (i + 1) * 3),
          str = vertex.join(','),
          index = v2i[str];

      if (index === undefined) {
        index = v2i[str] = i2v.length;
        i2v.push(vertex);
      }
      if (faces.length % 6 === 0) {
        faces.push(3);
      }
      faces.push(index);
      if (faces.length % 6 === 5) {
        faces.push(materials[Math.floor(faces.length / 36)]);
      }
    }

    return {
      vertices: _.flatten(i2v),
      faces: faces
    };
  };

  exports.triangulate = function(voxels) {
    var vertices = exports.triangulateVoxels(voxels),
        materials = exports.extractMaterials(voxels),
        mesh = exports.uniqueVertices(vertices, materials.indices);

    return _.extend({}, mesh, {
      metadata: {
        formatVersion: 3,
        vertices: mesh.vertices.length / 3,
        faces: mesh.faces.length / 6,
        normals: 0,
        colors: 0,
        uvs: 0,
        materials: materials.materials.length,
        morphTargets: 0
      },
      materials: materials.materials,
      morphTargets: [],
      normals: [],
      colors: [],
      uvs: [[]]
    });
  };

  return exports;
})();
