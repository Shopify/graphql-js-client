import Client from './client';
import {resetProfiler, startProfiling, pauseProfiling, captureTypeProfile, captureProfile} from './profile-schema-usage';

export {default as GraphModel} from './graph-model';
export {default as ClassRegistry} from './class-registry';
export {default as decode} from './decode';

Object.assign(Client, {
  resetProfiler,
  startProfiling,
  pauseProfiling,
  captureTypeProfile,
  captureProfile
});

export default Client;
