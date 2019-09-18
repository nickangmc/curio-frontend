import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import { getUserData } from "../../actions/userActions";

import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Image,
  Text
} from "react-native";

// date converter
import Moment from "moment";

// custom component
import SimpleHeader from "../../component/SimpleHeader";
import MyButton from "../../component/MyButton";
import ProfileSetting from "../../component/ProfileSetting";

class Profile extends Component {
  constructor() {
    super();
  }

  componentWillUpdate(nextProps) {
    // sets user data
    if (nextProps.user.userData !== this.props.user.userData) {
      this.setState({
        userData: nextProps.user.userData
      });
    }
  }

  // logout button
  onLogoutClick = () => {
    const { navigate } = this.props.navigation;
    this.props.logoutUser().then(res => {
      navigate("Auth");
    });
  };

  render() {
    // date format
    Moment.locale("en");
    const dt = this.props.user.userData.dateJoined;

    return (
      <View style={styles.container}>
        <SimpleHeader title="Profile" />

        {/* scrollable area for CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* user profile picture */}
          {this.props.user.userData.profilePic != null ? (
            <Image
              style={styles.profilePic}
              source={{ uri: this.props.user.userData.profilePic }}
            />
          ) : (
            <Image
              style={styles.profilePic}
              source={require("../../../assets/images/default-profile-pic.png")}
            />
          )}

          {/* user heading */}
          <Text style={styles.userName}>{this.props.user.userData.name}</Text>
          <Text style={styles.userDetails}>
            joined since {Moment(dt).format("Do MMMM YYYY")}
          </Text>

          {/* line separator */}
          <View style={styles.line} />

          <ProfileSetting text="Artefacts" />
          <ProfileSetting text="Friends" />
          <ProfileSetting text="Account Details" />

          {/* line separator */}
          <View style={styles.line} />

          {/* logout button */}
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <MyButton onPress={this.onLogoutClick} text="LOG OUT" />
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },

  userName: {
    fontSize: 24,
    marginTop: 5,
    alignSelf: "center",
    fontFamily: "HindSiliguri-Bold"
  },

  userDetails: {
    fontSize: 14,
    marginTop: 3,
    marginBottom: 10,
    alignSelf: "center",
    color: "#939090",
    fontFamily: "HindSiliguri-Regular"
  },

  profilePic: {
    marginTop: 30,
    width: Dimensions.get("window").width * 0.45,
    height: Dimensions.get("window").width * 0.45,
    borderRadius: (Dimensions.get("window").width * 0.45) / 2,
    alignSelf: "center"
  },

  line: {
    marginTop: 20,
    borderBottomColor: "#939090",
    borderBottomWidth: 0.4,
    width: Dimensions.get("window").width * 0.8,
    alignSelf: "center"
  },

  button: {
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "#FF6E6E",
    width: Dimensions.get("window").width * 0.4,
    height: 50,
    margin: 10,
    borderRadius: 40,
    elevation: 3
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    alignSelf: "center",
    color: "white",
    fontFamily: "HindSiliguri-Regular"
  }
});

Profile.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  getUserData: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  user: state.user
});

export default connect(
  mapStateToProps,
  { logoutUser, getUserData }
)(Profile);
