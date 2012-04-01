// # puppet module
var puppet = (function() {
  var exports = {};

  // ## public functions

  exports.reconstruction = function(urls, onSuccess) {
    var count = _.size(urls),
        images = {};

    _.map(urls, function(url, face) {
      exports.loadImage(url, function(img) {
        --count;

        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        images[face] = ctx.getImageData(0, 0, img.width, img.height);

        if (count <= 0) {
          onSuccess(exports.doReconstruction(images));
        }
      });
    });
  };

  // ## private functions

  // ### reconstruction voxels
  exports.doReconstruction = function(images) {
    return exports.triangulate(exports.generateVoxels(images));
  };
 
  exports.loadImage = function(src, onload) {
    var img = new Image();
    img.onload = function() {
      onload(img);
    };
    img.src = src;
  };

  exports.toHsv = function(r255, g255, b255, a255) {
    var r = r255 / 255.0, g = g255 / 255.0, b = b255 / 255.0,
        max, min, h;

    if (r >= g && r >= b) {
      max = r;
      min = Math.min(g, b);
      h = Math.PI * (g - b) / ((max - min) * 3);
    } else if (g >= r && g >= b) {
      max = g;
      min = Math.min(r, b);
      h = Math.PI * (b - r) / ((max - min) * 3) + 2 * Math.PI / 3;
    } else {
      max = b;
      min = Math.min(r, g);
      h = Math.PI * (r - b) / ((max - min) * 3) + 4 * Math.PI / 3;
    }

    if (h < 0) {
      h += Math.PI * 2;
    }

    return {
      h: h,
      s: (max - min) / max,
      v: max,
      a: a255 / 255.0
    };
  };

  exports.toHsvImage = function(imageData) {
    var result = {
          width: imageData.width,
          height: imageData.height,
          data: []
        },
        size = result.width * result.height * 4;

    for (var i = 0; i < size; i += 4) {
      result.data.push(exports.toHsv(
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2],
        imageData.data[i + 3]
      ));
    }

    return result;
  };

  exports.readColor = function(hsvImage, x, y) {
    x = Math.max(0, Math.min(hsvImage.width - 1, x));
    y = Math.max(0, Math.min(hsvImage.height - 1, y));
    return hsvImage.data[y * hsvImage.width + x];
  };

  // Following block matching implementation is strongly based on this document.
  // http://www.cvl.iis.u-tokyo.ac.jp/~vanno/Programming/stereo_program.pdf
  // I use simplest algorithm SAD, but add small change for calc difference.

  exports.diffHsv = function(hsv1, hsv2) {
    if (hsv1.a > 0 && hsv2.a > 0) {
      return Math.abs(hsv1.h - hsv2.h) +
             Math.abs(hsv1.s - hsv2.s) +
             Math.abs(hsv1.v - hsv2.v) +
             Math.abs(hsv1.a - hsv2.a);
    } else {
      return 0;
    }
  };

  exports.calcSad = function(hsvImage1, x1, y1, hsvImage2, x2, y2, blockSize) {
    var result = 0;
    for (var y = -blockSize; y < blockSize; ++y) {
      for (var x = -blockSize; x < blockSize; ++x) {
        var hsv1 = exports.readColor(hsvImage1, x1 + x, y1 + y),
            hsv2 = exports.readColor(hsvImage2, x2 + x, y2 + y);

        result += exports.diffHsv(hsv1, hsv2);
      }
    }
    return result;
  };

  var SEARCH_RANGE = 10, SAD_BLOCK_SIZE = 5;
  exports.findImportantPixelPair = function(front, right) {
    var minSad = Number.MAX_VALUE,
        result;

    for (var y1 = 0; y1 < front.height; ++y1) {
      for (var x1 = front.width / 2; x1 < front.width; ++x1) {
        var color = exports.readColor(front, x1, y1);
        if (color.a > 0) {
          for (var y2 = Math.max(y1 - SEARCH_RANGE, 0); y2 < Math.min(y1 + SEARCH_RANGE, right.height); ++y2) {
            for (var x2 = 0; x2 < right.width; ++x2) {
              var sad = exports.calcSad(front, x1, y1, right, x2, y2, SAD_BLOCK_SIZE);
              if (sad < minSad) {
                minSad = sad;
                result = {frontX: x1, frontY: y1, rightX: x2, rightY: y2};
              }
            }
          }
        }
      }
    }
    return result;
  };

  exports.matchPixels = function(front, right) {
    var result = [];
    for (var y1 = 0; y1 < front.height; ++y1) {
      var pairs = [];
      for (var x1 = front.width / 2; x1 < front.width; ++x1) {
        var color = exports.readColor(front, x1, y1);
        if (color.a > 0) {
          var min = {sad: Number.MAX_VALUE};
          for (var y2 = Math.max(y1 - SEARCH_RANGE, 0); y2 < Math.min(y1 + SEARCH_RANGE, right.height); ++y2) {
            for (var x2 = 0; x2 < right.width; ++x2) {
              var sad = exports.calcSad(front, x1, y1, right, x2, y2, SAD_BLOCK_SIZE);
              if (sad < min.sad) {
                min = {sad: sad, frontX: x1, frontY: y1, rightX: x2, rightY: y2};
              }
            }
          }
          if (min.pair) {
            pairs.push(min);
          }
        }
      }
      if (row.length > 0) {
        result.push({y: y1, pairs: pairs});
      }
    }
    return result;
  };

  function doFitMin(func, first, firstValue, last, lastValue, recurCount) {
    var MAX_RECUR = 10, EPSILON = 0.00000001,
        mid = (first + last) / 2,
        midValue = func(mid);

    if (midValue <= EPSILON) {
      return mid;
    }

    ++recurCount;
    if (recurCount < MAX_RECUR) {
      if (firstValue < lastValue) {
        return doFitMin(func, first, firstValue, mid, midValue, recurCount);
      } else {
        return doFitMin(func, mid, midValue, last, lastValue, recurCount);
      }
    } else {
      return _.min([
        {key: first, value: firstValue},
        {key: last, value: lastValue},
        {key: mid, value: midValue}
      ], function(pair) {return pair.value;}).key;
    }
  }

  exports.fitMin = function(func, first, last) {
    return doFitMin(func, first, func(first), last, func(last), 0);
  };

  exports.calcZ = function(frontX, rightX, theta) {
    return frontX * Math.tan(theta) + rightX * sin(theta);
  };

  exports.evaluateCameraAngles = function(pairs, width, theta) {
    //var penalty = 0;
    //for (var r = 0; r < pairs.length; ++r) {
    //  var row = paris[r];
    //  for (var c = 0; c < row.pairs.length; ++c) {
    //    var pair = row.pairs[c],
    //        z = exports.calcZ(pair.frontX, pair.rightX, theta);

    //    if (Math.abs(z) <= width / 2 || 
    //  }
    //}
    //return 0;
  };

  exports.fillVoxelLine = function(voxels, image, xsign, zfirst, zlast) {
    zfirst = Math.floor(zfirst);
    zlast = Math.floor(zlast);

    for (var x = 0; x < image.width; ++x) {
      if (!voxels[x]) {
        voxels[x] = [];
      }
      for (var y = 0; y < image.height; ++y) {
        var i = ((xsign > 0 ? x : image.width - x - 1) + y * image.width) * 4,
            c = (image.data[i] << 16) |
                (image.data[i + 1] << 8) |
                image.data[i + 2] |
                (image.data[i + 3] << 24);

        if (!voxels[x][y]) {
          voxels[x][y] = [];
        }
        for (var z = zfirst; z < zlast; ++z) {
          voxels[x][y][z] = c;
        }
      }
    }
  };

  exports.generateVoxels = function(images) {
    var voxels = [],
        w = images.front.width, hw = w / 2;

    exports.fillVoxelLine(voxels, images.front, 1, 0, hw);
    exports.fillVoxelLine(voxels, images.back, -1, hw, w);

    return _.reduce(voxels, function(ret, plane, x) {
      for (var y = 0; y < plane.length; ++y) {
        var line = plane[y];
        for (var z = 0; z < line.length; ++z) {
          var c = line[z];
          if ((c >> 24) & 0xFF !== 0) {
            ret.push(x - hw - 0.5, y - hw - 0.5, hw - z - 0.5, c);
          }
        }
      }
      return ret;
    }, []);
  };

  // ### triangulation
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
      uvs: []
    });
  };


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
          voxels[i],
          voxels[i + 1],
          voxels[i + 2]
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

  return exports;
})();
