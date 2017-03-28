import Client from './client';
import {resetTracker, startTracking, pauseTracking, trackedTypes, printTypes} from './track-type-dependency';

export {default as GraphModel} from './graph-model';
export {default as ClassRegistry} from './class-registry';
export {default as decode} from './decode';

Object.assign(Client, {
  resetTracker,
  startTracking,
  pauseTracking,
  trackedTypes,
  printTypes
});

export default Client;
