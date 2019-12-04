import { SET_USER_GROUPS, SET_GROUP_IN_CACHE } from "../types/groupsTypes";

const initialState = {
  userGroups: [],
  cache: {}
};

// cache format: {
//   groupId: {
//     group data: {},
//     members data: {}
//   }
// }

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_USER_GROUPS:
      return {
        ...state,
        userGroups: action.payload
      };
    case SET_GROUP_IN_CACHE:
      // access cache from store
      const { cache } = state;
      // extract action data
      const { payload, cache_type } = action;
      // if group is not in cache, initialize it
      if (!cache[payload._id]) cache[payload._id] = {};
      // update if exist, else add new group data to the cache
      cache[payload._id][cache_type] = payload;
      // set redux state
      return {
        ...state,
        cache
      };
    default:
      return state;
  }
}
