import React, { Component } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Text
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";

// import all register Constants
import { C } from "../../types/registerTypes";

// import reusable button component
import MyButton from "../../component/MyButton";

// import entry field validators
import {
  validateName,
  validateEmail,
  validatePassword
} from "./registerValidator";

// import width/height responsive functions
import {
  deviceHeigthDimension as hp,
  deviceWidthDimension as wd,
  setToBottom
} from "../../utils/responsiveDesign";

import CustomFontText from "../../utils/customFontText";

// Load new page after each completed stage in sign up
class RegisterManager extends Component {
  state = {
    nameErrorMessage: "",
    emailErrorMessage: "",
    pwdErrorMessage: ""
  };

  componentDidMount() {
    this.getPermissionAsync();
  }

  // camera roll permissions
  getPermissionAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
    }
  };

  // access camera roll
  _pickImage = async () => {
    // obtain image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4]
    });

    // set image
    if (!result.cancelled) {
      this.props.photoURLHandler(result.uri);
    }
  };

  // Skip button for photos
  skipPhotoText(photo) {
    if (photo != null) {
      return "Next";
    } else {
      return "Skip";
    }
  }

  // error handlers
  async errorName() {
    this.setState({
      nameErrorMessage: await validateName(this.props.name)
    });

    // with no errors, proceed to next page
    if (this.state.nameErrorMessage === "") {
      this.props.stageHandler(C.GET_EMAIL);
    }
  }

  async errorEmail() {
    this.setState({
      emailErrorMessage: await validateEmail(this.props.email)
    });

    // with no errors, proceed to next page
    if (this.state.emailErrorMessage === "") {
      this.props.stageHandler(C.GET_PASSWORD);
    }
  }

  async errorPassword() {
    this.setState({
      pwdErrorMessage: await validatePassword(
        this.props.password,
        this.props.passwordCfm
      )
    });

    // with no errors, proceed to next page
    if (this.state.pwdErrorMessage === "") {
      this.props.stageHandler(C.GET_PHOTO);
    }
  }

  render() {
    switch (this.props.registerStage) {
      case C.GET_NAME:
        return (
          <View style={styles.cardContainer}>
            {/* title */}
            <CustomFontText style={styles.inputText}>
              Hey, first tell us your name!
            </CustomFontText>

            <TextInput
              style={styles.inputField}
              placeholder="Jon Snow"
              autoCapitalize="none"
              placeholderTextColor="#868686"
              onChangeText={val => this.props.nameHandler(val)}
              value={this.props.name}
              onSubmitEditing={() => this.errorName()}
            />

            {this.state.nameErrorMessage !== "" && (
              <CustomFontText style={styles.error}>
                {" "}
                {this.state.nameErrorMessage}{" "}
              </CustomFontText>
            )}

            {setToBottom(
              <MyButton
                style={styles.nextButton}
                onPress={() => this.errorName()}
                text="Next"
              />
            )}
          </View>
        );
      case C.GET_EMAIL:
        return (
          <View style={styles.cardContainer}>
            {/* title */}
            <CustomFontText style={styles.inputText}>
              Now, enter your email address!
            </CustomFontText>

            <TextInput
              style={styles.inputField}
              placeholder="abc@email.com"
              autoCapitalize="none"
              placeholderTextColor="#868686"
              onChangeText={val => this.props.emailHandler(val)}
              value={this.props.email}
              onSubmitEditing={() => this.errorEmail()}
            />

            {this.state.emailErrorMessage !== "" && (
              <CustomFontText style={styles.error}>
                {" "}
                {this.state.emailErrorMessage}{" "}
              </CustomFontText>
            )}

            {setToBottom(
              <View style={styles.buttom}>
                <TouchableOpacity
                  onPress={() => this.props.stageHandler(C.GET_NAME)}
                >
                  <CustomFontText style={styles.backButton}>
                    Back
                  </CustomFontText>
                </TouchableOpacity>

                <MyButton
                  style={styles.nextButton}
                  onPress={() => this.errorEmail()}
                  text="Next"
                />
              </View>
            )}
          </View>
        );
      case C.GET_PASSWORD:
        return (
          <View style={styles.cardContainer}>
            {/* Title */}
            <CustomFontText style={[styles.inputText, styles.passwordTitle]}>
              Great, create your unique password!
            </CustomFontText>

            {/* password */}
            <CustomFontText
              style={[styles.inputText, styles.passwordFieldTitle]}
            >
              {" "}
              Password:{" "}
            </CustomFontText>
            <TextInput
              style={[styles.inputField, styles.passwordField]}
              secureTextEntry={true}
              autoCapitalize="none"
              placeholderTextColor="#868686"
              onChangeText={val => this.props.passwordHandler(val)}
              value={this.props.password}
            />

            {/* Cfm password */}
            <CustomFontText
              style={[styles.inputText, styles.passwordFieldTitle]}
            >
              {" "}
              Confirm Password:{" "}
            </CustomFontText>
            <TextInput
              style={[styles.inputField, styles.passwordField]}
              secureTextEntry={true}
              autoCapitalize="none"
              placeholderTextColor="#868686"
              onChangeText={val => this.props.passwordCfmHandler(val)}
              value={this.props.passwordCfm}
              onSubmitEditing={() => this.errorPassword()}
            />

            {this.state.pwdErrorMessage !== "" && (
              <CustomFontText style={styles.error}>
                {" "}
                {this.state.pwdErrorMessage}{" "}
              </CustomFontText>
            )}

            {setToBottom(
              <View style={styles.buttom}>
                <TouchableOpacity
                  onPress={() => this.props.stageHandler(C.GET_EMAIL)}
                >
                  <CustomFontText style={styles.backButton}>
                    Back
                  </CustomFontText>
                </TouchableOpacity>

                <MyButton
                  style={styles.nextButton}
                  onPress={() => this.errorPassword()}
                  text="Next"
                />
              </View>
            )}
          </View>
        );

      case C.GET_PHOTO:
        return (
          <View style={styles.cardContainer}>
            {/* Title */}
            <CustomFontText style={styles.photoMainTitle}>
              Almost there!
            </CustomFontText>
            <CustomFontText style={styles.photoSubTitle}>
              Take a minute to upload a photo.
            </CustomFontText>

            {/* Image button */}
            <TouchableOpacity activeOpacity={0.5} onPress={this._pickImage}>
              {this.props.photoURL != null ? (
                <Image
                  style={[styles.profilePic, styles.profilePicBorder]}
                  source={{ uri: this.props.photoURL }}
                />
              ) : (
                <Image
                  style={styles.profilePic}
                  source={require("../../../assets/images/plus-profile-pic.png")}
                />
              )}
            </TouchableOpacity>

            {setToBottom(
              <View style={styles.buttom}>
                <TouchableOpacity
                  onPress={() => this.props.stageHandler(C.GET_PASSWORD)}
                >
                  <CustomFontText style={styles.backButton}>
                    Back
                  </CustomFontText>
                </TouchableOpacity>

                <MyButton
                  style={styles.nextButton}
                  text={this.skipPhotoText(this.props.photoURL)}
                  onPress={() => this.props.onSubmit()} // moves to welcome page and will be logged in
                />
              </View>
            )}
          </View>
        );

      default:
        return (
          <View>
            <CustomFontText>error 404</CustomFontText>
          </View>
        );
    }
  }
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    flexDirection: "column",
    padding: wd(0.05)
  },

  inputField: {
    textAlign: "center",
    width: wd(0.7),
    height: hp(0.05),
    marginTop: 20,
    backgroundColor: "white",
    borderBottomWidth: 0.5,
    fontSize: 16,
    alignSelf: "center"
  },

  inputText: {
    fontWeight: "bold",
    alignSelf: "center",
    fontSize: hp(0.026)
  },

  passwordTitle: {
    marginBottom: hp(0.024),
    fontSize: hp(0.024)
  },

  photoMainTitle: {
    fontWeight: "bold",
    fontSize: hp(0.028),
    marginBottom: hp(0.02)
  },

  photoSubTitle: {
    fontWeight: "bold",
    fontSize: hp(0.024)
  },

  passwordFieldTitle: {
    fontSize: hp(0.022),
    alignSelf: "flex-start",
    marginLeft: wd(0.015)
  },

  passwordField: {
    marginTop: hp(0.01),
    fontSize: hp(0.02),
    height: hp(0.03),
    marginBottom: hp(0.05)
  },

  profilePic: {
    marginTop: 30,
    width: wd(0.3),
    height: wd(0.3),
    alignSelf: "center"
  },

  profilePicBorder: {
    borderRadius: wd(0.3) / 2
  },

  buttom: {
    alignSelf: "center",
    flexDirection: "row",
    width: wd(0.7935),
    alignItems: "center",
    justifyContent: "space-between"
  },

  backButton: {
    fontSize: hp(0.022),
    alignSelf: "center",
    marginLeft: wd(0.03),
    textDecorationLine: "underline",
    color: "#FF6E6E",
    fontFamily: "HindSiliguri-Regular"
  },

  nextButton: {
    alignSelf: "flex-end"
  },

  error: {
    color: "red",
    alignSelf: "center"
  }
});

export default RegisterManager;
