import {
  // action constants
  SET_USER_ARTEFACTS,
  SET_ARTEFACT_IN_CACHE,
  // cache types
  ARTEFACT_DATA
} from "../types/artefactsTypes";

const initialState = {
  // store list of user's artefacts' ids
  userArtefactIds: [],
  // store artefacts data
  cache: {}
};

// note :-
// cache format: {
//   artefactId: {
//      artefact data: {},  // cache type
//      comments: {}        // cache type
//   },
//   other_artefactId: {...},
//   ...
// }

export default function(state = initialState, action) {
  // access cache from store
  const { cache } = state;
  // extract action data
  const { payload } = action;
  switch (action.type) {
    // update user's artefacts
    case SET_USER_ARTEFACTS:
      // for each user's artefact, save it to cache
      for (artefact of payload) {
        // if artefact is not yet saved in cache, initialize it
        if (!cache[artefact._id]) cache[artefact._id] = {};
        // update if exist, add new artefact data to the cache
        cache[artefact._id][ARTEFACT_DATA] = artefact;
      }
      // set new redux state
      return {
        ...state,
        cache,
        // update user's artefact ids
        userArtefactIds: payload.map(artefact => artefact._id)
      };

    case SET_ARTEFACT_IN_CACHE:
      // extract action data
      const { cache_type } = action;
      // if artefact is not yet saved in cache, initialize it
      if (!cache[payload._id]) cache[payload._id] = {};
      // update if exist, add new artefact data to the cache
      cache[payload._id][cache_type] = payload;
      // set new redux state
      return {
        ...state,
        cache
      };

    default:
      return state;
  }
}
