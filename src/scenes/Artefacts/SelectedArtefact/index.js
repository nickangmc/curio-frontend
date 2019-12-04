import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Alert,
  StatusBar,
  RefreshControl
} from "react-native";

// date converter
import Moment from "moment";

// custom component
import { LikeButton, UnlikeButton } from "../../../component/LikeButton";
import CommentButton from "../../../component/CommentButton";
import CommentForm from "../../../component/CommentForm";
import UserDetail from "../../../component/UserDetail";
import Comments from "../../../component/Comments";
import OptionButton from "../../../component/OptionButton";
import HeaderImageScrollView from "react-native-image-header-scroll-view";
import ImageView from "react-native-image-view";
import KeyboardShift from "../../../component/componentHelpers/KeyboardShift";

// redux actions
import {
  editSelectedArtefact,
  getSelectedArtefact,
  getUserArtefacts,
  removeSelectedArtefact,
  likeArtefact,
  unlikeArtefact,
  getArtefactComments,
  commentOnArtefact,
  clearSelectedArtefact
} from "../../../actions/artefactsActions";

import {
  ARTEFACT_COMMENTS,
  ARTEFACT_DATA
} from "../../../types/artefactsTypes";

import { getSelectedGroupAllArtefacts } from "../../../actions/groupsActions";

import { getSelectedUser } from "../../../actions/userActions";

// import the loader modal to help show loading process
import ActivityLoaderModal from "../../../component/ActivityLoaderModal";

// custom responsive design component
import {
  deviceWidthDimension as wd,
  deviceHeigthDimension as hp
} from "../../../utils/responsiveDesign";

class SelectedArtefact extends Component {
  constructor(props) {
    super(props);
    // get artefact id passed in from the navigation parameter
    const { artefactId } = this.props.navigation.state.params;
    // setup initial local state values
    this.state = {
      // local page settings state
      isImageViewVisible: false,
      isUpdateModalVisible: false,
      loading: false,
      refreshing: false,
      // artefact details state
      newComment: "",
      liked: 0,
      likesCount: 0,
      commentsCount: 0,
      likingEnabled: true,
      // artefact owner
      owner: {},
      artefactId,
      // selected artefact data
      comments: []
    };
    // make sure it exists
    artefactId
      ? this.getSelectedArtefactData(artefactId)
      : alert("Error loading artefact data");
  }

  // asynchronously make api calls to get selectedArtefact data into redux state
  //prettier-ignore
  async getSelectedArtefactData(artefactId) {
    Promise.all([
      this.props.getSelectedArtefact(artefactId),
      this.props.getArtefactComments(artefactId)
    ])
      .then(data => {
        const artefact = data[0];
        const comments = data[1];
        // set artefact data into local state
        this.setState({ artefact, comments }, () => {
          // in the callback of the setState
          // set artefact details into state
          this.setState({
            liked: artefact.likes.includes(this.props.user.userData._id),
            likesCount: artefact.likes.length,
            commentsCount: comments.length
          })
          // extract owner id
          const { userId } = this.state.artefact;
          // get owner data and store in local state
          this.props.getSelectedUser(userId)
            .then(owner => {
              this.setState({ owner }, () => Promise.resolve())
            })
            .catch(err => Promise.reject(err));
        });
      })
      .catch(err => {
        console.log(JSON.stringify(err.response));
        alert("Please try again later");
        Promise.reject(err);
      });
  }

  getArtefactDetails = () => {};

  // nav details
  static navigationOptions = {
    header: null,
    headerStyle: {
      elevation: 0 // remove shadow on Android
    }
  };

  // setter function for "loading" to show user that something is loading
  setLoading = loading => {
    this.setState({ loading });
  };

  // check if user is the owner of the artefact
  isUserArtefactOwner = () => {
    // get required state data
    const ownerId = this.props.artefacts.cache[this.state.artefactId].userId;
    const userId = this.props.user.userData._id;
    // return true if user is owner, otherwise false
    return userId === ownerId;
  };

  // setter function for handling new changes in local comment state
  onChangeNewComment = newComment => {
    this.setState({ newComment });
  };

  // refresh page
  reloadData = async () => {
    const { reloadDataAtOrigin } = this.props.navigation.state.params;
    // load refresh animation
    this.setState({ refreshing: true });
    // get data from backend
    artefactId = this.props.navigation.getParam("artefactId");
    // reload everything at once, only refresh once everything is done loading
    await this.getSelectedArtefactData(artefactId);
    // reload group data //
    // reload data on origin/source page if required (it is not null)
    if (reloadDataAtOrigin) reloadDataAtOrigin();
    // resets refreshing state
    this.setState({ refreshing: false });
  };

  // toggle the modal for artefact deletion
  toggleDeleteModal = async () => {
    Alert.alert(
      "Delete Artefact",
      "Are you sure you want to delete your artefact?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => this.onDeleteSelectedArtefact()
        }
      ],
      { cancelable: false }
    );
  };

  // when user presses "delete artefact"
  onDeleteSelectedArtefact = async () => {
    const {
      origin,
      artefactId,
      reloadDataAtOrigin
    } = this.props.navigation.state.params;
    // show user the loading modal
    this.setLoading(true);
    // remove selected artefact from redux states
    //prettier-ignore
    await this.props.removeSelectedArtefact(artefactId)
      .then(() => {
        // stop showing user the loading modal
        this.setLoading(false);
        // reload group data
        // reload data on origin page if required (it is not null)
        if (reloadDataAtOrigin) reloadDataAtOrigin();
        // redirect back to previous page
        this.navigateToPage(origin);
      })
      .catch(err => {
        // stop showing user the loading modal
        this.setLoading(false);
        // show error
        console.log(JSON.stringify(err.response));
      });
  };

  // navigation functions //
  onUserProfilePress = userId => {
    this.navigateToPage("PublicProfile", { userId });
  };

  // when user presses "edit artefact"
  onArtefactEdit = () => {
    // extract artefact data
    const { artefact } = this.props.artefacts.cache[
      this.state.artefactId
    ].ARTEFACT_DATA;
    // pass it along
    this.navigateToPage("ArtefactsForm", {
      artefact,
      isEditMode: true,
      reloadDataAtOrigin: this.reloadData.bind(this)
    });
  };

  // main navigation function
  navigateToPage = (page, options) => {
    const { push } = this.props.navigation;
    const { artefactId } = this.state;
    push(page, {
      origin: "SelectedArtefact",
      artefactId,
      ...options
    });
  };

  getArtefactFromCache = () => {
    // extract artefact data
    const { artefactId } = this.state;
    const { cached } = this.props.artefacts.cache[artefactId];
    // return early
    if (!cached) return null;
    // return artefact
    return cached.ARTEFACT_DATA;
  };

  // like an artefact
  like = function() {
    // logic
    if (this.state.likingEnabled) {
      this.setState({
        liked: true,
        likesCount: this.state.likesCount + 1,
        likingEnabled: false
      });
      // make an api call to the backend to like artefact
      this.props
        .likeArtefact(artefact._id, this.props.user.userData._id)
        .then(
          function() {
            this.setState({ likingEnabled: true });
          }.bind(this)
        )
        .catch(
          function() {
            this.setState({ likingEnabled: true });
            alert("An error occured. Please try again.");
          }.bind(this)
        );
    }
  };

  // unlike an artefact
  unlike = function() {
    // extract artefact data
    const { artefact } = this.props.artefacts.cache[
      this.state.artefactId
    ].ARTEFACT_DATA;
    // logic
    if (this.state.likingEnabled) {
      this.setState({
        liked: false,
        likesCount: this.state.likesCount - 1,
        likingEnabled: false
      });
      // make an api call to the backend to unlike artefact
      this.props
        .unlikeArtefact(artefact._id, this.props.user.userData._id)
        .then(
          function() {
            this.setState({ likingEnabled: true });
          }.bind(this)
        )
        .catch(
          function() {
            this.setState({ likingEnabled: true });
            alert("An error occured. Please try again.");
          }.bind(this)
        );
    }
  };

  // scroll to the bottom of the comments
  scrollToEnd = function() {
    this.scrollView.scrollToEnd();
  };

  // post new comment
  postComment = async function(commentContent) {
    // extract artefact data
    const { artefactId } = this.state;
    const { artefact } = this.props.artefacts.cache[artefactId].ARTEFACT_DATA;
    // logic
    await this.props.commentOnArtefact(
      artefact._id,
      this.props.user.userData._id,
      commentContent
    );
    // reload page
    this.reloadData(artefactId);
  };

  showOptions = () => {
    return this.isUserArtefactOwner() ? (
      <OptionButton
        firstOption={"Edit Artefact"}
        secondOption={"Delete Artefact"}
        toggleFirstOption={this.onArtefactEdit}
        toggleSecondOption={this.toggleDeleteModal}
      />
    ) : (
      <View />
    );
  };

  // show all comments
  showComments = function() {
    // sort comments by date
    const comments = this.state.comments.sort(function(a, b) {
      return new Date(a.datePosted) - new Date(b.datePosted);
    });
    // transform each artefact to a Comments component
    const commentComponents = comments.map(comment => (
      <Comments
        key={comment._id}
        userProfilePic={comment.posterPic}
        userId={comment.posterId}
        userName={comment.posterName}
        datePosted={comment.datePosted}
        comment={comment.content}
        onPress={this.onUserProfilePress.bind(this)}
      />
    ));
    return commentComponents;
  };

  render() {
    // date format
    Moment.locale("en");
    // extract artefact data
    const { artefactId } = this.state;
    const cached = this.props.artefacts.cache[artefactId];
    // early return
    if (!cached) return null;
    const artefact = cached.ARTEFACT_DATA;
    // // does not render when selectedArtefact is empty
    // if (!Object.keys(artefact).length) return null;
    //prettier-ignore
    // prepare artefact image
    const artefactImage = [{ source: { uri: artefact.images[0].URL }}];
    // extract owner details
    const { owner } = this.state;

    return (
      <KeyboardShift>
        {() => (
          <View style={styles.container}>
            {/* loading modal window */}
            <ActivityLoaderModal loading={this.state.loading} />

            {/* header */}
            <HeaderImageScrollView
              ref={scrollView => {
                this.scrollView = scrollView;
              }}
              maxHeight={hp(0.5)}
              minHeight={hp(0)}
              // use this to dynamically get image data
              headerImage={{ uri: artefact.images[0].URL }}
              renderForeground={() => (
                // change this to open the image in full screen
                <TouchableOpacity
                  style={styles.cover}
                  onPress={() =>
                    this.setState({
                      isImageViewVisible: true,
                      statusBarHidden: true
                    })
                  }
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.refreshing}
                  onRefresh={this.reloadData}
                />
              }
            >
              {/* open image in full screen */}
              <ImageView
                images={artefactImage}
                isVisible={this.state.isImageViewVisible}
                onClose={() => this.setState({ isImageViewVisible: false })}
                animationType={"fade"}
                isSwipeCloseEnabled={true}
              />

              {/* desciption */}
              <View style={styles.descriptionPlaceholder}>
                <View style={{ flexDirection: "row" }}>
                  {/* title */}
                  <Text style={styles.title}>{artefact.title}</Text>
                  {/* option */}
                  {this.showOptions()}
                </View>

                {/* description */}
                <Text style={styles.description}>{artefact.description}</Text>
              </View>

              {/* user detail */}
              <UserDetail
                image={{ uri: owner.profilePic }}
                userId={owner._id}
                userName={owner.name}
                dateAdded={artefact.datePosted}
                onPress={this.onUserProfilePress.bind()}
              />
              {/* likes/comments counters */}
              <View style={styles.likesIndicatorPlaceholder}>
                <Text style={styles.indicator}>
                  {this.state.likesCount} Likes {this.state.commentsCount}{" "}
                  Comments
                </Text>
              </View>

              {/* button */}
              <View style={styles.likesButtonPlaceholder}>
                {this.state.liked === true ? (
                  <UnlikeButton onPress={this.unlike.bind(this)} />
                ) : (
                  <LikeButton onPress={this.like.bind(this)} />
                )}
                {/* Comment button */}
                <CommentButton onPress={() => this.scrollToEnd()} />
              </View>
              {/* comments */}
              <View style={styles.comments}>
                <Text style={styles.commentsTitle}>Comments</Text>
                {/* comments */}
                {this.showComments()}
                <CommentForm
                  newComment={this.state.newComment}
                  onChangeNewComment={this.onChangeNewComment}
                  profilePic={this.props.user.userData.profilePic}
                  onSubmitEditing={event => {
                    this.postComment(event.nativeEvent.text);
                    this.onChangeNewComment("");
                  }}
                />
              </View>
            </HeaderImageScrollView>
          </View>
        )}
      </KeyboardShift>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight
  },

  cover: {
    height: Dimensions.get("window").height * 0.5,
    width: Dimensions.get("window").width
  },

  descriptionPlaceholder: {
    marginHorizontal: wd(0.06)
  },

  title: {
    fontFamily: "HindSiliguri-Bold",
    fontSize: 20,
    marginTop: wd(0.03),
    width: Dimensions.get("window").width * 0.8
  },

  description: {
    fontFamily: "HindSiliguri-Regular",
    fontSize: 16,
    marginVertical: wd(0.03)
  },

  likesIndicatorPlaceholder: {
    marginHorizontal: wd(0.06),
    marginVertical: wd(0.03)
  },

  indicator: {
    fontFamily: "HindSiliguri-Regular",
    fontSize: 12,
    color: "#939090"
  },

  likesButtonPlaceholder: {
    flexDirection: "row",
    marginVertical: wd(0.02)
  },

  comments: {
    alignItems: "center"
  },

  commentsTitle: {
    marginHorizontal: wd(0.05),
    // marginTop: wd(0.05),
    fontFamily: "HindSiliguri-Bold",
    alignSelf: "flex-start",
    fontSize: 24
  }
});

// check for prop types correctness
SelectedArtefact.propTypes = {
  artefacts: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired
};

// map required redux state to local props
const mapStateToProps = state => ({
  artefacts: state.artefacts,
  user: state.user
});

// map required redux state and actions to local props
export default connect(mapStateToProps, {
  editSelectedArtefact,
  getSelectedArtefact,
  getUserArtefacts,
  removeSelectedArtefact,
  likeArtefact,
  unlikeArtefact,
  getArtefactComments,
  commentOnArtefact,
  clearSelectedArtefact,
  getSelectedGroupAllArtefacts,
  getSelectedUser
})(SelectedArtefact);
