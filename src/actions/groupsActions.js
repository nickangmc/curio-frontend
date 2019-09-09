import axios from "axios";

import {
  SET_NEW_GROUP,
} from "../types/groupsTypes";

// Create New Group
export const createNewGroup = adminId => dispatch => {
    return axios
    .get("http://curioapp.herokuapp.com/api/'/group/adminId/" + adminId)
    .then(res => {
      dispatch(setNewGroup(res.data));
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
  );
}

// assign new group to user
export const setNewGroup = decoded => {
  return {
    type: SET_NEW_GROUP,
    payload: decoded
  };
};