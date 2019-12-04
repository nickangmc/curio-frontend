import React, { Component } from "react";
import { Notifications } from "expo";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  createSwitchNavigator,
  createAppContainer,
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import { white } from "ansi-colors";
import { Image } from "react-native";

import NotificationTabBarIcon from "../component/notificationTabBarIcon";

import StartScreen from "./Start";
import RegisterScreen from "./Register";
import LoginScreen from "./Login";
import WelcomeScreen from "./Welcome";
import AuthLoadingScreen from "./AuthLoadingScreen";
import GroupsScreen from "./Groups";
import ProfileScreen from "./Profile";
import NotificationScreen from "./Notification";
import ArtefactsScreen from "./Artefacts";
import PublicProfileScreen from "./PublicProfile";
import InvitationScreen from "./Invitation";
import SelectedArtefactScreen from "./Artefacts/SelectedArtefact";
import SelectedGroupScreen from "./Groups/SelectedGroup";
import ArtefactsFormScreen from "./Artefacts/ArtefactsForm";
import GroupsFormScreen from "./Groups/GroupsForm";
import AccountSettingScreen from "./Profile/AccountSetting";
import GeneralSearchScreen from "./GeneralSearch";
import UserSearchScreen from "./Groups/UserSearch";

import { getUserData } from "../actions/userActions";
import { getUserArtefacts } from "../actions/artefactsActions";
import { getUserGroups } from "../actions/groupsActions";
import { getUserNotifications } from "../actions/notificationActions";

//prettier-ignore
const { registerForPushNotificationsAsync } = require("../services/notification/registerForPushNotificationsAsync");

class Scenes extends Component {
  // for scenarios: there's an user stayed logged in on app launch
  // or there's no user logged in on app launch
  async componentDidMount() {
    // let scenes actively listen to new received notif
    this.listener = Notifications.addListener(this.listen);
    // load all the required user data if user is logged-in
    if (this.props.auth.isAuthenticated) {
      // retrieve and setup data
      this.setupUserAppData();
    }
  }

  // for scenario: an user logs out on the app and tries to log back in
  async componentDidUpdate(prevProps) {
    // extract users details from redux states
    const user = this.props.auth.user;
    const previousUser = prevProps.auth.user;
    // a user logs in and there's no previous user data in redux store
    if (
      Object.keys(previousUser).length === 0 &&
      Object.keys(user).length > 0
    ) {
      // retrieve and setup data
      this.setupUserAppData();
    }
  }

  // retrieve and setup initial required data upon app launch after user logs in
  setupUserAppData = () => {
    // get user authentication data
    const { user } = this.props.auth;
    // get user data and artefacts
    this.props.getUserData(user.id);
    this.props.getUserArtefacts(user.id);
    this.props.getUserGroups(user.id);
    this.props.getUserNotifications(user.id);
    // post user's expo-push-token to backend if haven't already
    registerForPushNotificationsAsync(user.id);
  };

  componentWillUnmount() {
    // let scenes stop listening to new received notif
    this.listener = Notifications.removeListener(this.listen);
  }

  // notification listener function
  listen = () => {
    // on new notification received:
    // reload user notifications
    this.props.getUserNotifications(this.props.auth.user.id);
  };

  onChangeSearchInput = searchInput => {
    this.setState({
      searchInput
    });
  };

  render() {
    return <AppContainer />;
  }
}

// screens that every tab stack can get to
const generalStack = {
  // search screens
  UserSearch: { screen: UserSearchScreen },
  GeneralSearch: { screen: GeneralSearchScreen },
  // user selected pages
  PublicProfile: { screen: PublicProfileScreen },
  SelectedGroup: { screen: SelectedGroupScreen },
  SelectedArtefact: { screen: SelectedArtefactScreen },
  // form pages
  GroupsForm: { screen: GroupsFormScreen },
  ArtefactsForm: { screen: ArtefactsFormScreen }
};

// tab stacks //
const GroupStack = createStackNavigator({
  Groups: { screen: GroupsScreen },
  ...generalStack
});

const ArtefactStack = createStackNavigator({
  Artefacts: { screen: ArtefactsScreen },
  ...generalStack
});

const NotificationStack = createStackNavigator({
  Notification: { screen: NotificationScreen },
  Invitation: { screen: InvitationScreen },
  ...generalStack
});

const ProfileStack = createStackNavigator({
  Profile: { screen: ProfileScreen },
  AccountSetting: { screen: AccountSettingScreen }
});

// login / signup stack
const AuthStack = createStackNavigator({
  Start: { screen: StartScreen },
  Register: { screen: RegisterScreen },
  Login: { screen: LoginScreen },
  Welcome: { screen: WelcomeScreen }
});

// default app stack
const AppStack = createBottomTabNavigator(
  {
    GroupTab: {
      screen: GroupStack,
      navigationOptions: {
        tabBarIcon: ({ tintColor }) => (
          <Image
            source={require("../../assets/images/icons/group.png")}
            style={{ height: 27, width: 27, tintColor: tintColor }}
          />
        )
      }
    },
    ArtefactTab: {
      screen: ArtefactStack,
      navigationOptions: {
        tabBarIcon: ({ tintColor }) => (
          <Image
            source={require("../../assets/images/icons/artefacts.png")}
            style={{ height: 27, width: 27, tintColor: tintColor }}
          />
        )
      }
    },
    NotificationTab: {
      screen: NotificationStack,
      navigationOptions: {
        tabBarIcon: ({ tintColor }) => (
          <NotificationTabBarIcon tintColor={tintColor} />
        )
      }
    },
    ProfileTab: {
      screen: ProfileStack,
      navigationOptions: {
        tabBarIcon: ({ tintColor }) => (
          <Image
            source={require("../../assets/images/icons/profile.png")}
            style={{ height: 27, width: 27, tintColor: tintColor }}
          />
        )
      }
    }
  },
  // styling for the tab bar
  {
    tabBarOptions: {
      activeTintColor: "#FF6E6E",
      inactiveTintColor: "#737373",
      showLabel: false,
      style: {
        backgroundColor: white,
        borderColor: "#939090",
        borderTopWidth: 0.5,
        height: 50
      }
    }
  }
);

const AppContainer = createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: AuthLoadingScreen,
      Auth: AuthStack,
      App: AppStack
    },
    {
      initialRouteName: "AuthLoading"
    }
  )
);

Scenes.propTypes = {
  auth: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  artefacts: PropTypes.object.isRequired,
  getUserData: PropTypes.func.isRequired,
  getUserArtefacts: PropTypes.func.isRequired,
  getUserGroups: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  user: state.user,
  artefacts: state.artefacts,
  groups: state.groups
});

export default connect(mapStateToProps, {
  getUserData,
  getUserArtefacts,
  getUserGroups,
  getUserNotifications
})(Scenes);
