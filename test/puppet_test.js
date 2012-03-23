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

//describe('math.intersectRayAndPlane', function() {
//  it('returns intersection position', function() {
//    var actual = math.intersectRayAndPlane(
//      math.v3(1, -1, 1), math.v3(0, 1, 0),
//      math.plane(math.v3(0, 0.5, 0), math.v3(0, 1, 0)));
//
//    expect(actual.distanceTo(math.v3(1, 0.5, 1)) < EPSILON).to.be(true);
//  });
//
//  it('returns null if intersection is not found', function() {
//    var actual = math.intersectRayAndPlane(
//      math.v3(1, -1, 1), math.v3(0, -1, 0),
//      math.plane(math.v3(0, 0.5, 0), math.v3(0, 1, 0)));
//
//    expect(actual).to.be(null);
//  });
//});

