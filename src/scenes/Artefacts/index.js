import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  StyleSheet,
  ScrollView,
  StatusBar,
  View,
  Text,
  Animated,
  RefreshControl
} from "react-native";

// custom components
import ArtefactFeed from "../../component/ArtefactFeed";
import SimpleHeader from "../../component/SimpleHeader";
import AddButton from "../../component/AddButton";

// redux actions
import {
  createNewArtefact,
  getSelectedArtefact,
  getUserArtefacts,
  getArtefactComments
} from "../../actions/artefactsActions";

// Custom respondsive design component
import {
  deviceHeigthDimension as hp,
  deviceWidthDimension as wd
} from "../../utils/responsiveDesign";
import { ARTEFACT_DATA } from "../../types/artefactsTypes";

class Artefacts extends Component {
  constructor(props) {
    super(props);
    // setup initial state
    this.state = {
      loading: false,
      refreshing: false,
      isPublicTab: true,
      searchInput: ""
    };
    // set up initial animation value
    this.fadeAnimation = new Animated.Value(0);
  }

  // Nav bar details
  static navigationOptions = {
    header: null
  };

  // animation trigger
  startShowing = () => {
    Animated.timing(this.fadeAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  };

  // user types in new search terms
  onChangeSearchInput = searchInput => {
    this.setState({ searchInput });
  };

  // setter functions //
  // setter function for change privacy tab
  onChangePrivacyTab = () => {
    this.setState({ isPublicTab: !this.state.isPublicTab });
  };

  // re-retrieve all required data - also used in page refresh
  reloadData = async () => {
    this.setState({ refreshing: true });
    // get data from backend
    await this.props.getUserArtefacts(this.props.auth.user.id);
    // resets refreshing state
    this.setState({ refreshing: false });
  };

  // navigation functions //
  // user press + button to create a new artefact
  onNewArtefactCreate = () => {
    // redirect user
    this.navigateToPage("ArtefactsForm");
  };

  // artefact feed functions //
  // for each individual artefact clicked by user
  onArtefactClick = artefactId => {
    // redirect user
    this.navigateToPage("SelectedArtefact", { artefactId });
  };

  // main navigation function
  navigateToPage = (page, options) => {
    const { push } = this.props.navigation;
    push(page, {
      origin: "Artefacts",
      ...options
    });
  };

  // component render functions //
  // tell users that they don't have an artefact posted under current privacy tab
  showEmptyArtefactsMessage = () => {
    // show fade-in animation for this message
    this.startShowing();
    // get current tab setting
    privacy = this.state.isPublicTab ? 0 : 1;
    // message displayed in public or private tab (public = 0, private = 1)
    let type = !privacy ? "public" : "private";
    let message = !privacy
      ? "Public artefacts can be viewed by everyone"
      : "Private artefacts can only be seen by yourself";
    return (
      <Animated.View
        style={[styles.emptyFeed, { opacity: this.fadeAnimation }]}
      >
        <Text style={styles.emptyfeedText}>
          Looks like you haven't posted any {type} artefacts
        </Text>
        <Text style={styles.emptyfeedText}>
          Click the "+" button to add some
        </Text>
        <Text style={styles.emptyfeedText}>
          {"\n"}
          {message}
        </Text>
      </Animated.View>
    );
  };

  // retrieve current user's artefacts in the redux cache
  getUserArtefactsFromCache = () => {
    // first retrieve all the user's artefacts ids
    artefactIds = this.props.artefacts.userArtefactIds;
    // get the actual artefact data based on the ids
    artefacts = artefactIds.map(id => {
      // retrieve artefact by id from cache
      cachedArtefact = this.props.artefacts.cache[id];
      // return its data if it exists, otherwise return nothing
      return cachedArtefact ? cachedArtefact[ARTEFACT_DATA] : null;
    });
    // return the data
    return artefacts;
  };

  // show artefacts by privacy settings
  showArtefacts = () => {
    // extract required data
    artefacts = this.getUserArtefactsFromCache();
    // check current page's privacy settings
    privacy = this.state.isPublicTab ? 0 : 1;
    // filter artefacts by their privacy settings
    artefacts = artefacts.filter(x => x.privacy == privacy);

    // return modularized feed component
    return artefacts.length ? (
      <ArtefactFeed
        artefacts={artefacts}
        onPress={this.onArtefactClick.bind(this)}
      />
    ) : (
      // no artefacts on current tab, show empty message
      this.showEmptyArtefactsMessage()
    );
  };

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        {/* scrollable area for artefact feeds */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.reloadData}
            />
          }
        >
          {/* header */}
          <SimpleHeader
            title="My Artefacts"
            showTab={true}
            onChangePrivacyTab={this.onChangePrivacyTab}
            isPublicTab={this.state.isPublicTab}
            tab1="Public"
            tab2="Private"
            showSearch={true}
            searchInput={this.state.searchInput}
            onChangeSearchInput={this.onChangeSearchInput}
            pressClear={() => this.onChangeSearchInput("")}
            onSubmitEditing={() =>
              navigate("GeneralSearch", {
                searchTerms: this.state.searchInput
              })
            }
            pressSearch={() =>
              navigate("GeneralSearch", {
                searchTerms: this.state.searchInput
              })
            }
          />
          {/* all artefacts posted by the user based on the their privacy settings */}
          {this.showArtefacts()}
        </ScrollView>

        {/* create new Group */}
        <AddButton onPress={this.onNewArtefactCreate.bind(this)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight,
    backgroundColor: "#FAFAFA"
  },

  emptyFeed: {
    flex: 1,
    height: hp(0.709),
    alignItems: "center",
    justifyContent: "center"
  },

  emptyfeedText: {
    fontSize: hp(0.02),
    fontFamily: "HindSiliguri-Regular"
  }
});

// check for prop types correctness
Artefacts.propTypes = {
  artefacts: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  getUserArtefacts: PropTypes.func.isRequired,
  createNewArtefact: PropTypes.func.isRequired
};

// map required redux state to local props
const mapStateToProps = state => ({
  artefacts: state.artefacts,
  auth: state.auth
});

// map required redux state and actions to local props
export default connect(mapStateToProps, {
  createNewArtefact,
  getSelectedArtefact,
  getUserArtefacts,
  getArtefactComments
})(Artefacts);
