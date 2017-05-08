import Client from './client';
import {resetTracker, startTracking, pauseTracking, captureTypeProfile, captureProfile} from './track-type-dependency';

export {default as GraphModel} from './graph-model';
export {default as ClassRegistry} from './class-registry';
export {default as decode} from './decode';

Object.assign(Client, {
  resetTracker,
  startTracking,
  pauseTracking,
  captureTypeProfile,
  captureProfile
});

export default Client;
