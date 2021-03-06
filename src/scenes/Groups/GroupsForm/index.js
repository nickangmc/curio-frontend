import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Picker
} from "react-native";

// redux actions and expo modules
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  createNewGroup,
  editSelectedGroup
} from "../../../actions/groupsActions";

// Custom respondsive design component
import {
  deviceHeigthDimension as hp,
  deviceWidthDimension as wd
} from "../../../utils/responsiveDesign";

// import the loader modal to help show loading process
import ActivityLoaderModal from "../../../component/ActivityLoaderModal";
// custom components
import MySmallerButton from "../../../component/MySmallerButton";
import KeyboardShift from "../../../component/componentHelpers/KeyboardShift";
import { validator } from "./groupsFormValidator";

// default states for newGroup
const newGroup = {
  adminId: "",
  title: "",
  description: "",
  privacy: true,
  coverPhoto: "",
  imageURI: ""
};

class GroupsForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      group: {
        ...newGroup,
        // add & replace group details if group data is passed in
        // otherwise, it will not replace anything
        ...this.props.navigation.getParam("group"),
        adminId: this.props.auth.user.id
      },
      loading: false,
      errors: {
        imageError: "",
        titleError: "",
        descriptionError: ""
      }
    };
  }

  // nav details
  static navigationOptions = {
    title: "Create new group",
    headerStyle: {
      elevation: 0 // remove shadow on Android
    }
  };

  // newGroup's attribute change
  setGroup = (key, value) => {
    this.setState({
      group: {
        ...this.state.group,
        [key]: value
      }
    });
  };

  // revert newGroup to initial state
  resetGroup = () => {
    this.setState({
      ...this.state,
      group: {
        ...newGroup,
        adminId: this.props.auth.user.id
      }
    });
  };

  // setter function for "loading" to show user that something is loading
  setLoading = loading => {
    this.setState({
      loading
    });
  };

  // Setters for all the local state for creating/editing Group
  setTitle = title => {
    this.setGroup("title", title);
  };
  setDescription = description => {
    this.setGroup("description", description);
  };
  setPrivacy = privacy => {
    this.setGroup("privacy", privacy);
  };
  setImageURI = ImageURI => {
    this.setGroup("imageURI", ImageURI);
    // set this value to show it in the image component in the form
    // because in edit mode, group only has coverPhoto, not imageURL
    this.setGroup("coverPhoto", ImageURI);
  };

  // use Promise at setState callback to ensure load sequence
  validateField(errorField, inputField, guard = null) {
    // extract field name and value
    let field = Object.keys(inputField)[0];
    let value = Object.values(inputField)[0];
    // set local error states
    return this.setState(
      state => {
        return {
          errors: {
            ...state.errors,
            [errorField]: validator(field, value, guard)
          }
        };
      },
      () => Promise.resolve(true)
    );
  }

  // validate inputs make sure no fields are empty
  validateAllFields = () => {
    return new Promise((resolve, reject) => {
      const { title, imageURI, description, coverPhoto } = this.state.group;
      const imageGuard = coverPhoto ? coverPhoto : null;
      // validates against all field at the same time
      Promise.all([
        this.validateField("titleError", { title }),
        this.validateField("descriptionError", { description }),
        this.validateField("imageError", { imageURI }, coverPhoto)
      ]).then(() => {
        // done, can check the state now
        const { imageError, titleError, descriptionError } = this.state.errors;
        //valid inputs
        // if all inputs are not = "" or not null
        if (!imageError && !titleError && !descriptionError) {
          resolve(true);
        }
        // invalid inputs
        else {
          resolve(false);
        }
      });
    });
  };

  // create/edit group on "post" button press
  onSubmit = async () => {
    const { navigate } = this.props.navigation;
    // get required parameters
    const {
      origin,
      isEditMode,
      reloadDataAtOrigin
    } = this.props.navigation.state.params;
    // set adminId as a reference
    await this.setGroup("adminId", this.props.auth.user.id);
    // wait for it to complete validating all fields
    // if validateAllField return false (gt errors), return early
    if (!(await this.validateAllFields())) {
      return;
    }
    // if no errors, proceed here
    // show user the loading modal
    this.setLoading(true);
    // use appropriate action based on current page mode (either editing or creating)
    (() => {
      return isEditMode
        ? this.props.editSelectedGroup(this.state.group)
        : this.props.createNewGroup(this.state.group);
    })()
      .then(() => {
        // stop showing user the loading modal
        this.setLoading(false);
        // reset new group details
        this.resetGroup();
        // reload group data
        // reload data on origin page if required (it is not null)
        if (reloadDataAtOrigin) reloadDataAtOrigin();
        // navigate back
        navigate(origin);
      })
      .catch(err => {
        // stop showing user the loading modal
        this.setLoading(false);
        // show error
        console.log(err.response.data);
      });
  };

  // access camera roll
  pickImage = async () => {
    // obtain image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true
    });

    // set imageURI in local state
    if (!result.cancelled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.uri,
        [{ resize: { width: 1024 } }],
        { format: "jpeg", compress: 0.5 }
      );
      this.setImageURI(manipResult.uri);
    }
  };

  render() {
    // error messages
    const { errors, group } = this.state;

    var imageSource = !group.coverPhoto
      ? require("../../../../assets/images/icons/addPicture.png")
      : { uri: this.state.group.coverPhoto };

    return (
      <KeyboardShift>
        {() => (
          <View style={styles.container}>
            {/* loading modal window */}
            <ActivityLoaderModal loading={this.state.loading} />

            {/* scrollable container for all content */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: "center" }}>
                {/* Add image button */}
                <View style={styles.imagePlaceholder}>
                  <Text style={[styles.font, styles.imageText]}>
                    Create a group, share artefacts amongst yourselves
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={this.pickImage}
                  >
                    <Image style={styles.imageSelected} source={imageSource} />
                  </TouchableOpacity>

                  {/* error messages if there's any */}
                  {errors.imageError != "" ? (
                    <Text style={[styles.error, { alignSelf: "center" }]}>
                      {" "}
                      {errors.imageError}{" "}
                    </Text>
                  ) : (
                    <Text style={[styles.subFont, styles.imageText]}>
                      Add images of your artefacts
                    </Text>
                  )}
                </View>

                {/* Title */}
                <View style={styles.inputRow}>
                  <Image
                    style={styles.icon}
                    source={require("../../../../assets/images/icons/title.png")}
                  />
                  <View style={styles.inputField}>
                    <Text style={styles.font}>Group name</Text>
                    <TextInput
                      placeholder="Title"
                      autoCapitalize="none"
                      placeholderTextColor="#868686"
                      style={styles.inputFont}
                      onChangeText={value => this.setTitle(value)}
                      value={this.state.group.title}
                    />
                  </View>
                </View>
                {/* error messages if there's any */}
                {errors.titleError !== "" && (
                  <Text
                    style={[
                      styles.error,
                      { alignSelf: "flex-start", marginLeft: wd(0.12) }
                    ]}
                  >
                    {" "}
                    {errors.titleError}{" "}
                  </Text>
                )}

                {/* Description */}
                <View style={styles.inputRow}>
                  <Image
                    style={styles.icon}
                    source={require("../../../../assets/images/icons/description.png")}
                  />
                  <View style={styles.inputField}>
                    <Text style={styles.font}>Description</Text>
                    <TextInput
                      placeholder="Description of the group"
                      autoCapitalize="none"
                      placeholderTextColor="#868686"
                      style={styles.inputFont}
                      onChangeText={value => this.setDescription(value)}
                      value={this.state.group.description}
                    />
                  </View>
                </View>
                {/* error messages if there's any */}
                {errors.descriptionError !== "" && (
                  <Text
                    style={[
                      styles.error,
                      { alignSelf: "flex-start", marginLeft: wd(0.12) }
                    ]}
                  >
                    {errors.descriptionError}
                  </Text>
                )}

                {/* Privacy */}
                <View style={styles.inputRow}>
                  <Image
                    style={styles.icon}
                    source={require("../../../../assets/images/icons/category.png")}
                  />
                  <View style={styles.inputField}>
                    <Text style={styles.font}>Privacy</Text>

                    <Picker
                      style={styles.pickerLong}
                      selectedValue={this.state.group.privacy}
                      onValueChange={(itemValue, itemIndex) =>
                        this.setPrivacy(itemValue)
                      }
                    >
                      <Picker.Item label="Public" value={0} />
                      <Picker.Item label="Private" value={1} />
                    </Picker>
                  </View>
                </View>

                {/* submit button */}
                <View
                  style={{
                    alignItems: "flex-end",
                    marginVertical: wd(0.05),
                    width: wd(0.8)
                  }}
                >
                  <MySmallerButton
                    text="POST"
                    onPress={() => this.onSubmit()}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </KeyboardShift>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center"
  },

  font: {
    fontFamily: "HindSiliguri-Bold",
    fontSize: hp(0.02)
  },

  subFont: {
    fontFamily: "HindSiliguri-Regular",
    fontSize: hp(0.015),
    color: "#868686"
  },

  inputFont: {
    fontFamily: "HindSiliguri-Regular",
    fontSize: 14
  },

  icon: {
    height: wd(0.04),
    width: wd(0.04),
    marginTop: 5,
    marginRight: 20,
    alignSelf: "flex-start"
  },

  imagePlaceholder: {
    marginTop: 5
  },

  imageSelected: {
    alignSelf: "center",
    width: wd(0.25),
    height: wd(0.25),
    borderRadius: 5
  },

  imageText: {
    alignSelf: "center",
    marginVertical: hp(0.025)
  },

  inputRow: {
    flexDirection: "row",
    width: wd(0.8),
    marginVertical: hp(0.01)
  },

  inputField: {
    flex: 1,
    borderBottomWidth: 0.5
  },

  date: {
    width: wd(0.3),
    marginTop: 5
  },

  pickerShort: {
    width: wd(0.3),
    fontSize: hp(0.015),
    color: "black"
  },

  pickerLong: {
    width: wd(0.705),
    fontSize: hp(0.015),
    color: "black"
  },

  error: {
    color: "red"
  }
});

// check for prop types correctness
GroupsForm.propTypes = {
  auth: PropTypes.object.isRequired,
  createNewGroup: PropTypes.func.isRequired
};

// map required redux state to local props
const mapStateToProps = state => ({
  auth: state.auth
});

// map required redux state and actions to local props
export default connect(
  mapStateToProps,
  { createNewGroup, editSelectedGroup }
)(GroupsForm);
