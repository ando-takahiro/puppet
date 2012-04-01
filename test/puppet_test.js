var expect = require('expect.js'),
    browser = require('./browser'),
    EPSILON = 0.0000001;

browser.load('src/puppet.js');

describe('puppet.fitMin', function() {
  it('finds min output argument of the function', function() {
    var E = 0.001;

    function f(x) {
      return x * x;
    }

    expect(puppet.fitMin(f, -1, 1)).to.be.within(-E, E);
    expect(puppet.fitMin(f, -0.5, 1)).to.be.within(-E, E);
    expect(puppet.fitMin(f, -3, 1)).to.be.within(-E, E);
  });
});

describe('puppet.toHsv', function() {
  it('converts into hsv color space', function() {
    expect(puppet.toHsv(100, 120, 100, 123)).to.eql({
      h: 120 / 180.0 * Math.PI,
      s: (120 - 100) / 120,
      v: 120 / 255.0,
      a: 123 / 255.0
    });
  });

  it('accepts (0, 0, 0) also', function() {
    expect(puppet.toHsv(100, 120, 100, 123)).to.eql({
      h: 120 / 180.0 * Math.PI,
      s: (120 - 100) / 120,
      v: 120 / 255.0,
      a: 123 / 255.0
    });
  });
});

describe('puppet.toHsvImage', function() {
  it('converts imageData of canvas into internal hsv image format', function() {
    expect(puppet.toHsvImage({
      width: 2,
      height: 2,
      data: [
        123, 112, 12, 231,
        23, 52, 212, 231,
        83, 62, 112, 231,
        33, 112, 17, 210
      ]
    })).to.eql({
      width: 2,
      height: 2,
      data: [
        {
          h: 0.9434212172942322,
          s: 0.9024390243902439,
          v: 0.4823529411764706,
          a: 0.9058823529411765
        },
        {
          h: 3.141592653589793,
          s: 0.8915094339622641,
          v: 0.8313725490196079,
          a: 0.9058823529411765
        },
        {
          h: 3.581415625092364,
          s: 0.44642857142857145,
          v: 0.4392156862745098,
          a: 0.9058823529411765
        },
        {
          h: 1.9180249885074525,
          s: 0.8482142857142857,
          v: 0.4392156862745098,
          a: 0.8235294117647058
        }
      ]
   });
  });
});

describe('puppet.readColor', function() {
  var hsvImage = puppet.toHsvImage({
    width: 2,
    height: 2,
    data: [
      123, 112, 12, 231,
      23, 52, 212, 231,
      83, 62, 112, 231,
      33, 112, 17, 210
    ]
  });

  it('reads color at x, y in hsvImage', function() {
    expect(puppet.readColor(hsvImage, 1, 1)).to.eql({
      h: 1.9180249885074525,
      s: 0.8482142857142857,
      v: 0.4392156862745098,
      a: 0.8235294117647058
    });
  });

  it('fetches with coordinate clamp', function() {
    expect(puppet.readColor(hsvImage, -1, -1)).to.eql(puppet.readColor(hsvImage, 0, 0));
    expect(puppet.readColor(hsvImage, 100, -1)).to.eql(puppet.readColor(hsvImage, 1, 0));
  });
});

describe('puppet.diffHsv', function() {
  it('calculates difference between 2 colors', function() {
    expect(puppet.diffHsv(
      {h: 1, s: 0.1, v: 0.2, a: 0.3},
      {h: 1, s: 0.1, v: 0.2, a: 0.3}
    )).to.be(0);

    expect(puppet.diffHsv(
      {h: 1, s: 0.1, v: 0.2, a: 0.3},
      {h: 1.1, s: 0.3, v: 0.21, a: 0.31}
    )).to.be(0.32000000000000006);
  });

  it('treats as same color when both alpha components are 0', function() {
    expect(puppet.diffHsv(
      {h: 1, s: 0.1, v: 0.2, a: 0.1},
      {h: 1, s: 0.1, v: 0.21, a: 0.1}
    )).to.be.within(0.009, 0.01);

    expect(puppet.diffHsv(
      {h: 1, s: 0.1, v: 0.2, a: 0.0},
      {h: 1, s: 0.1, v: 0.21, a: 0.0}
    )).to.be(0.0);
  });
});

describe('puppet.calcSad', function() {
  var hsvImage1 = puppet.toHsvImage({
        width: 2,
        height: 2,
        data: [
          123, 112, 12, 231,
          23, 52, 212, 231,
          83, 62, 112, 231,
          33, 112, 17, 210
        ]
      }),
      hsvImage2 = puppet.toHsvImage({
        width: 2,
        height: 2,
        data: [
          23, 112, 12, 231,
          23, 52, 212, 231,
          83, 62, 112, 231,
          33, 112, 17, 210
        ]
      });

  it('calculates SAD (Sum. of Absolute Diﬀerence)', function() {
    expect(puppet.calcSad(hsvImage1, 0, 0, hsvImage1, 0, 0, 2)).to.be(0);
    expect(puppet.calcSad(hsvImage1, 1, 1, hsvImage2, 1, 1, 1)).to.be(1.0885012909023992);
  });
});

describe('puppet.findImportantPixelPair', function() {
  var hsvImage1 = puppet.toHsvImage({
        width: 2,
        height: 2,
        data: [
          123, 112, 12, 231,
          23, 52, 212, 231,
          83, 62, 112, 231,
          33, 112, 17, 210
        ]
      }),
      hsvImage2 = puppet.toHsvImage({
        width: 2,
        height: 2,
        data: [
          23, 112, 12, 231,
          23, 52, 212, 231,
          83, 62, 112, 231,
          33, 112, 17, 210
        ]
      });

  it('finds minimum SAD pair between *right half* of front image and right image', function() {
    expect(puppet.findImportantPixelPair(hsvImage1, hsvImage1)).to.eql({
      frontX: 1, frontY: 0, rightX: 1, rightY: 0
    });

    expect(puppet.findImportantPixelPair(hsvImage1, hsvImage2)).to.eql({
      frontX: 1, frontY: 1, rightX: 1, rightY: 1
    });
  });

  it('returns *undefined* when both images are transparent', function() {
    var transparentImage = puppet.toHsvImage({
      width: 2,
      height: 2,
      data: [
        23, 112, 12, 0,
        23, 52, 212, 0,
        83, 62, 112, 0,
        33, 112, 17, 0
      ]
    });

    expect(puppet.findImportantPixelPair(transparentImage, transparentImage)).to.be();
  });
});

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
