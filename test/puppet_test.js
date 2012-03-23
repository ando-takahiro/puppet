var expect = require('expect.js'),
    browser = require('./browser'),
    EPSILON = 0.0000001;

browser.load('src/puppet.js');

describe('puppet.extractMaterials', function() {
  it('collets materials and removes duplication', function() {
    expect(puppet.extractMaterials(
      [
        0, 0, 0, 123,
        1, 1, 1, 111,
        2, 0, 2, 123
      ]
    )).to.eql({
      indices: [0, 1, 0],
      materials: [
        {
          DbgColor: 123,
          DbgIndex: 0,
          DbgName: 'Material0',
          colorAmbient: [0, 0, 0],
          colorDiffuse: [0, 0, 123 / 255.0],
          colorSpecular: [0.5, 0.5, 0.5],
          shading: 'Lambert',
          specularCoef: 50
        },
        {
          DbgColor: 111,
          DbgIndex: 1,
          DbgName: 'Material1',
          colorAmbient: [0, 0, 0],
          colorDiffuse: [0, 0, 111 / 255.0],
          colorSpecular: [0.5, 0.5, 0.5],
          shading: 'Lambert',
          specularCoef: 50
        }
      ]
    });
  });
});

describe('puppet.triangulateSingleVoxel', function() {
  it('emits 8 vertices of 1 unit cube', function() {
    expect(puppet.triangulateSingleVoxel(1, -2.1, 3.14)).to.eql([
      1.5, -2.6, 2.64,
      1.5, -2.6, 3.64,
      0.5, -2.6, 3.64,
      0.5, -2.6, 2.64,
      1.5, -1.6, 2.64,
      0.5, -1.6, 2.64,
      0.5, -1.6, 3.64,
      1.5, -1.6, 3.64,
      1.5, -2.6, 2.64,
      1.5, -1.6, 2.64,
      1.5, -1.6, 3.64,
      1.5, -2.6, 3.64,
      1.5, -2.6, 3.64,
      1.5, -1.6, 3.64,
      0.5, -1.6, 3.64,
      0.5, -2.6, 3.64,
      0.5, -2.6, 3.64,
      0.5, -1.6, 3.64,
      0.5, -1.6, 2.64,
      0.5, -2.6, 2.64,
      1.5, -1.6, 2.64,
      1.5, -2.6, 2.64,
      0.5, -2.6, 2.64,
      0.5, -1.6, 2.64
    ]);
  });
});

describe('puppet.triangulateVoxels', function() {
  it('emits 8 vertices from 1 voxel', function() {
    expect(puppet.triangulateVoxels([
          1, -2.1, 3.14, 111,
      -8.34, 12.1, 44.1, 123
    ])).to.eql([
      1.5, -2.6, 2.64,
      1.5, -2.6, 3.64,
      0.5, -2.6, 3.64,
      0.5, -2.6, 2.64,
      1.5, -1.6, 2.64,
      0.5, -1.6, 2.64,
      0.5, -1.6, 3.64,
      1.5, -1.6, 3.64,
      1.5, -2.6, 2.64,
      1.5, -1.6, 2.64,
      1.5, -1.6, 3.64,
      1.5, -2.6, 3.64,
      1.5, -2.6, 3.64,
      1.5, -1.6, 3.64,
      0.5, -1.6, 3.64,
      0.5, -2.6, 3.64,
      0.5, -2.6, 3.64,
      0.5, -1.6, 3.64,
      0.5, -1.6, 2.64,
      0.5, -2.6, 2.64,
      1.5, -1.6, 2.64,
      1.5, -2.6, 2.64,
      0.5, -2.6, 2.64,
      0.5, -1.6, 2.64,
      -7.84, 11.6, 43.6,
      -7.84, 11.6, 44.6,
      -8.84, 11.6, 44.6,
      -8.84, 11.6, 43.6,
      -7.84, 12.6, 43.6,
      -8.84, 12.6, 43.6,
      -8.84, 12.6, 44.6,
      -7.84, 12.6, 44.6,
      -7.84, 11.6, 43.6,
      -7.84, 12.6, 43.6,
      -7.84, 12.6, 44.6,
      -7.84, 11.6, 44.6,
      -7.84, 11.6, 44.6,
      -7.84, 12.6, 44.6,
      -8.84, 12.6, 44.6,
      -8.84, 11.6, 44.6,
      -8.84, 11.6, 44.6,
      -8.84, 12.6, 44.6,
      -8.84, 12.6, 43.6,
      -8.84, 11.6, 43.6,
      -7.84, 12.6, 43.6,
      -7.84, 11.6, 43.6,
      -8.84, 11.6, 43.6,
      -8.84, 12.6, 43.6 
    ]);
  });
});

describe('puppet.uniqueVertices', function() {
  it('removes duplicated vertices, and zip with material indices', function() {
    // pass 2 same voxel to target function
    expect(puppet.uniqueVertices(
      [
        0,  1, 2,
        3,  4, 5,
        0,  1, 2,
        0, -1, 2,

        0,  1, 2,
        3,  4, 5,
        0,  1, 2,
        0, -1, 2
      ],
      [
        0,
        1,
        2,
        3,

        0,
        1,
        2,
        3
      ]
    )).to.eql({
      vertices: [
        0, 1, 2,
        3,4, 5,
        0, -1, 2
      ],
      faces: [
        3, 0, 1, 0, 2, 0,
        3, 0, 1, 0, 2, 0
      ]
    });
  });
});

describe('puppet.triangulate', function() {
  it('removes duplicated vertices, and zip with material indices', function() {
    expect(puppet.triangulate([
    //x, y, z, fragment
      0, 1, 2, 123,
      3, 4, 5, 345
    ])).to.eql({
      vertices: [
        0.5, 0.5, 1.5,
        0.5, 0.5, 2.5,
        -0.5, 0.5, 2.5,
        -0.5, 0.5, 1.5,
        0.5, 1.5, 1.5,
        -0.5, 1.5, 1.5,
        -0.5, 1.5, 2.5,
        0.5, 1.5, 2.5,
        3.5, 3.5, 4.5,
        3.5, 3.5, 5.5,
        2.5, 3.5, 5.5,
        2.5, 3.5, 4.5,
        3.5, 4.5, 4.5,
        2.5, 4.5, 4.5,
        2.5, 4.5, 5.5,
        3.5, 4.5, 5.5
      ],
      faces: [
        3, 0, 1, 2, 3, 0,
        3, 4, 5, 6, 7, 0,
        3, 0, 4, 7, 1, 0,
        3, 1, 7, 6, 2, 0,
        3, 2, 6, 5, 3, 0,
        3, 4, 0, 3, 5, 0,
        3, 8, 9, 10, 11, 1,
        3, 12, 13, 14, 15, 1,
        3, 8, 12, 15, 9, 1,
        3, 9, 15, 14, 10, 1,
        3, 10, 14, 13, 11, 1,
        3, 12, 8, 11, 13, 1
      ],
      metadata: {
        formatVersion: 3,
        vertices: 16,
        faces: 12,
        normals: 0,
        colors: 0,
        uvs: 0,
        materials: 2,
        morphTargets: 0
      },
      materials: [
        {
          DbgColor: 123,
          DbgIndex: 0,
          DbgName: 'Material0',
          colorAmbient: [0, 0, 0],
          colorDiffuse: [0, 0, 123 / 255.0],
          colorSpecular: [0.5, 0.5, 0.5],
          shading: 'Lambert',
          specularCoef: 50
        },
        {
          DbgColor: 345,
          DbgIndex: 1,
          DbgName: 'Material1',
          colorAmbient: [0, 0, 0],
          colorDiffuse: [0, 0.00392156862745098, 0.34901960784313724],
          colorSpecular: [0.5, 0.5, 0.5],
          shading: 'Lambert',
          specularCoef: 50
        }
      ],
      morphTargets: [],
      normals: [],
      colors: [],
      uvs: []
    });
  });
});
