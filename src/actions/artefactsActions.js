import {
  SET_USER_ARTEFACTS,
  SET_ARTEFACT_IN_CACHE,
  ARTEFACT_DATA,
  ARTEFACT_COMMENTS,
  ARTEFACT_OWNER
} from "../types/artefactsTypes";

import {
  createArtefactAPIRequest,
  getUserArtefactsAPIRequest,
  getSelectedArtefactAPIRequest,
  updateSelectedArtefactAPIRequest,
  likeAPIRequest,
  unlikeAPIRequest,
  deleteSelectedArtefactAPIRequest,
  getArtefactCommentsAPIRequest,
  postArtefactCommentAPIRequest
} from "../utils/APIHelpers/artefactAPIHelpers";

import { getUserNotifications } from "../actions/notificationActions";

import { uploadImageToGCS } from "../utils/imageUpload";
import { getSelectedUser } from "../actions/userActions";

// Async Redux actions //
// get all artefacts of an user based on userId
export const getUserArtefacts = userId => dispatch => {
  return new Promise((resolve, reject) => {
    // get all artefacts posted by user
    getUserArtefactsAPIRequest(userId)
      // success
      .then(res => {
        dispatch(setUserArtefacts(res.data));
        resolve(res);
      })
      // failure
      .catch(err => {
        console.log("Failed to get user artefacts : " + err);
        reject(err);
      });
  });
};

// create a new artefact in the databse based on the artefact data given
export const createNewArtefact = artefact => dispatch => {
  return new Promise((resolve, reject) => {
    // upload image first
    uploadImageToGCS(artefact.imageURI)
      .then(imageURL => {
        // prepare the body data base on new user details
        const newArtefact = {
          ...artefact,
          imageURL,
          privacy: artefact.privacy === 0 ? 0 : 1
        };
        // send a post API request to backend to create new artefact
        createArtefactAPIRequest(newArtefact)
          .then(res => {
            // reload and update user's artefacts data
            dispatch(getUserArtefacts(newArtefact.userId));
            resolve(res);
          })
          .catch(err => {
            console.log("Failed to create new artefact: " + err);
            reject(err);
          });
      })
      .catch(err => {
        console.log("Failed to upload image at creating new artefact: " + err);
        reject(err);
      });
  });
};

// retrieve artefact's data via artefactId and save it to cache
export const getSelectedArtefact = artefactId => dispatch => {
  return new Promise((resolve, reject) => {
    // send API request for the artefact details
    getSelectedArtefactAPIRequest(artefactId)
      .then(res => {
        // save artefact's data in cache
        dispatch(setArtefactDataInCache(res.data));
        // return the data incase it's needed
        resolve(res.data);
      })
      .catch(err => {
        console.log("Failed to select artefact" + err);
        reject(err);
      });
  });
};

// update the selected artefact using new artefact data in the parameter
export const editSelectedArtefact = artefact => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    // decides if a new image upload is required
    (() => {
      // if a new image is selected by the user, the imageURI field would not
      // be empty so upload to GCS is required, otherwise just retain the old
      // URL link
      return !artefact.imageURI
        ? Promise.resolve(artefact.images[0].URL)
        : uploadImageToGCS(artefact.imageURI);
    })()
      .then(imageURL => {
        // insert the imageURL prepared to the artefact data field
        const artefactData = {
          ...artefact,
          images: [{ URL: imageURL }]
        };
        // send an API artefact update request to the backend
        updateSelectedArtefactAPIRequest(artefact._id, artefactData)
          .then(res => {
            // reload and update user's artefacts data
            dispatch(getUserArtefacts(getState().auth.user.id));
            // return the artefact's data
            resolve(res.data);
          })
          .catch(err => {
            console.log("Failed to update artefact" + err);
            reject(err);
          });
      })
      .catch(err => {
        console.log("Failed to get artefact's URL" + err);
        reject(err);
      });
  });
};

// delete the selected artefact specified by the parameter artefactId
export const removeSelectedArtefact = artefactId => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    // send a API delete request to the backend
    deleteSelectedArtefactAPIRequest(artefactId)
      .then(res => {
        // reload and update user's artefact data, as well as user's notifications
        dispatch(getUserArtefacts(getState().auth.user.id));
        dispatch(getUserNotifications(getState().auth.user.id));
        resolve(res);
      })
      .catch(err => {
        console.log("Failed to delete artefact" + err);
        reject(err);
      });
  });
};

// like an artefact
export const likeArtefact = (artefactId, userId) => dispatch => {
  return new Promise((resolve, reject) => {
    // add like to artefact from user
    likeAPIRequest(artefactId, userId)
      // success
      .then(res => {
        // return data
        resolve(res.data);
      })
      // failure
      .catch(err => {
        console.log("Failed to like an artefact: " + err);
        reject(err);
      });
  });
};

// unlike an artefact
export const unlikeArtefact = (artefactId, userId) => dispatch => {
  return new Promise((resolve, reject) => {
    // remove like to artefact from user
    unlikeAPIRequest(artefactId, userId)
      // success
      .then(res => {
        // return data
        resolve(res.data);
      })
      // failure
      .catch(err => {
        console.log("Failed to unlike an artefact: " + err);
        reject(err);
      });
  });
};

export const getArtefactOwner = (artefactId, ownerId) => dispatch => {
  return new Promise((resolve, reject) => {
    getSelectedUser(ownerId)
      .then(res => {
        console.log(res.data);
        dispatch(
          setArtefactOwnerInCache({
            ...res.data
          })
        );
        resolve(res.data);
      })
      .catch(err => {
        console.log("Failed to get artefact owner: " + err);
        reject(err);
      });
  });
};

// get all comments made about an artefact
export const getArtefactComments = artefactId => dispatch => {
  return new Promise((resolve, reject) => {
    // send API get request for the artefact comments
    getArtefactCommentsAPIRequest(artefactId)
      .then(res => {
        // save artefact's comments in cache
        dispatch(setArtefactCommentsInCache(res.data));
        // return data
        resolve(res.data);
      })
      .catch(err => {
        console.log("Failed to get artefact comments: " + err);
        reject(err);
      });
  });
};

// post comment on artefact
//prettier-ignore
export const commentOnArtefact = (artefactId, userId, commentString) => dispatch => {
  return new Promise((resolve, reject) => {
    // post comment to server
    var newComment = { content: commentString };
    postArtefactCommentAPIRequest(artefactId, userId, newComment)
      // success
      .then(res => {
        // retrieve latest comments and save it (not most efficient)
        dispatch(getArtefactComments(artefactId));
        resolve(res.data);
      })
      // failure
      .catch(err => {
        console.log("Failed to create new comment: " + err);
        reject(err);
      });
  });
};

// Redux actions //
// store all of the user's artefacts into redux state
export const setUserArtefacts = decoded => {
  return {
    type: SET_USER_ARTEFACTS,
    payload: decoded
  };
};
// save the artefact details to the cache based on the id
export const setArtefactDataInCache = decoded => {
  return {
    type: SET_ARTEFACT_IN_CACHE,
    payload: decoded,
    cache_type: ARTEFACT_DATA
  };
};
// save the artefact comments to the cache based on the id
export const setArtefactCommentsInCache = decoded => {
  return {
    type: SET_ARTEFACT_IN_CACHE,
    payload: decoded,
    cache_type: ARTEFACT_COMMENTS
  };
};

export const setArtefactOwnerInCache = decoded => {
  return {
    type: SET_ARTEFACT_IN_CACHE,
    payload: decoded,
    cache_type: ARTEFACT_OWNER
  };
};
