import * as THREE from '../../build/three.module.js';

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();

const _tmpGeometry = new THREE.BufferGeometry();

const _drawModes = {
  TrianglesDrawMode: THREE.TrianglesDrawMode,
  TriangleStripDrawMode: THREE.TriangleStripDrawMode,
  TriangleFanDrawMode: THREE.TriangleFanDrawMode,
};

function toTrianglesDrawMode( geometry, drawMode ) {

  if ( drawMode === THREE.TrianglesDrawMode ) {

    return geometry;

  }

  const index = geometry.getIndex();
  const positionAttribute = geometry.getAttribute( 'position' );
  const normalAttribute = geometry.getAttribute( 'normal' );
  const uvAttribute = geometry.getAttribute( 'uv' );
  const colorAttribute = geometry.getAttribute( 'color' );

  if ( index === null || positionAttribute === undefined ) {

    console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined non-indexed buffer geometry.' );

    return geometry;

  }

  const vertexCount = index.count;
  const vertexCount2 = vertexCount * 2;
  const vertexCount3 = vertexCount * 3;

  const indices = [];
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];

  const groups = geometry.groups;
  const groupCount = groups.length;
  const groupStart = groups[ 0 ] ? groups[ 0 ].start : 0;
  const groupIndex = groups[ 0 ] ? groups[ 0 ].index : 0;

  for ( let i = 0; i < vertexCount; i += 3 ) {

    const a = index.getX( i );
    const b = index.getX( i + 1 );
    const c = index.getX( i + 2 );

    indices.push( a, b, c );

    positions.push(
      positionAttribute.getX( a ), positionAttribute.getY( a ), positionAttribute.getZ( a ),
      positionAttribute.getX( b ), positionAttribute.getY( b ), positionAttribute.getZ( b ),
      positionAttribute.getX( c ), positionAttribute.getY( c ), positionAttribute.getZ( c )
    );

    if ( normalAttribute !== undefined ) {

      normals.push(
        normalAttribute.getX( a ), normalAttribute.getY( a ), normalAttribute.getZ( a ),
        normalAttribute.getX( b ), normalAttribute.getY( b ), normalAttribute.getZ( b ),
        normalAttribute.getX( c ), normalAttribute.getY( c ), normalAttribute.getZ( c )
      );

    }

    if ( uvAttribute !== undefined ) {

      uvs.push(
        uvAttribute.getX( a ), uvAttribute.getY( a ),
        uvAttribute.getX( b ), uvAttribute.getY( b ),
        uvAttribute.getX( c ), uvAttribute.getY( c )
      );

    }

    if ( colorAttribute !== undefined ) {

      colors.push(
        colorAttribute.getX( a ), colorAttribute.getY( a ), colorAttribute.getZ( a ),
        colorAttribute.getX( b ), colorAttribute.getY( b ), colorAttribute.getZ( b ),
        colorAttribute.getX( c ), colorAttribute.getY( c ), colorAttribute.getZ( c )
      );

    }

  }

  const result = new THREE.BufferGeometry();
  result.setIndex( indices );
  result.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

  if ( normals.length > 0 ) {

    result.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );

  }

  if ( uvs.length > 0 ) {

    result.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

  }

  if ( colors.length > 0 ) {

    result.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  }

  const groups2 = [];
  for ( let i = 0; i < groupCount; i ++ ) {

    const group = groups[ i ];
    groups2.push( {
      start: groupStart + group.start,
      count: group.count,
      materialIndex: group.materialIndex
    } );

  }
  result.groups = groups2;

  return result;

}

export { toTrianglesDrawMode };
