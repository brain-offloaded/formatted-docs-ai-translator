import { get } from 'lodash';

export type Box2D = [number, number, number, number];

const getCoordinate = (
  bbox: Box2D
): {
  y1: number;
  x1: number;
  y2: number;
  x2: number;
} => {
  return {
    y1: get(bbox, '[0]', 0),
    x1: get(bbox, '[1]', 0),
    y2: get(bbox, '[2]', 0),
    x2: get(bbox, '[3]', 0),
  };
};

const toBox2D = ({ y1, x1, y2, x2 }: { y1: number; x1: number; y2: number; x2: number }): Box2D => {
  return [y1, x1, y2, x2];
};

const setY1 = (bbox: Box2D, y1: number): Box2D => {
  const coord = getCoordinate(bbox);
  return toBox2D({
    y1,
    x1: coord.x1,
    y2: coord.y2,
    x2: coord.x2,
  });
};

const setX1 = (bbox: Box2D, x1: number): Box2D => {
  const coord = getCoordinate(bbox);
  return toBox2D({
    y1: coord.y1,
    x1,
    y2: coord.y2,
    x2: coord.x2,
  });
};

const setY2 = (bbox: Box2D, y2: number): Box2D => {
  const coord = getCoordinate(bbox);
  return toBox2D({
    y1: coord.y1,
    x1: coord.x1,
    y2,
    x2: coord.x2,
  });
};

const setX2 = (bbox: Box2D, x2: number): Box2D => {
  const coord = getCoordinate(bbox);
  return toBox2D({
    y1: coord.y1,
    x1: coord.x1,
    y2: coord.y2,
    x2,
  });
};

export const Box2D = {
  getCoordinate,
  toBox2D,
  setY1,
  setX1,
  setY2,
  setX2,
};
