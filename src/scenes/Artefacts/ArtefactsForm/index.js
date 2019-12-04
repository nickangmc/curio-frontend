import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Picker
} from "react-native";

// redux actions
import {
  createNewArtefact,
  editSelectedArtefact
} from "../../../actions/artefactsActions";

import { addArtefactToGroup } from "../../../actions/groupsActions";
import { validator } from "./artefactFormValidator";
import DatePicker from "react-native-datepicker";
import KeyboardShift from "../../../component/componentHelpers/KeyboardShift";

// expo image modules
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

// Custom respondsive design component
import {
  deviceHeigthDimension as hp,
  deviceWidthDimension as wd
} from "../../../utils/responsiveDesign";

// import the loader modal to help show loading process
import ActivityLoaderModal from "../../../component/ActivityLoaderModal";
// custom components
import MySmallerButton from "../../../component/MySmallerButton";

// temp state to store object with attributes required to create a new artefact
const newArtefact = {
  userId: "",
  title: "",
  description: "",
  category: "Art",
  dateObtained: "",
  imageURI: "",
  privacy: 1
};

class ArtefactsForm extends Component {
  constructor(props) {
    super(props);
    // setup initial state
    this.state = {
      artefact: {
        ...newArtefact,
        // add & replace artefact details if artefact data is passed in
        // otherwise, it will not replace anything
        ...this.props.navigation.getParam("artefact"),
        userId: this.props.auth.user.id
      },
      loading: false,
      errors: {
        imageError: "",
        titleError: "",
        categoryError: "",
        descriptionError: "",
        dateObtainedError: ""
      }
    };
  }

  // nav details
  static navigationOptions = {
    title: "Add New Artefact",
    headerStyle: {
      elevation: 0 // remove shadow on Android
    }
  };

  // new artefact's attribute change
  setArtefact = (key, value) => {
    this.setState({
      artefact: {
        ...this.state.artefact,
        [key]: value
      }
    });
  };

  // revert newArtefact to initial state
  resetArtefact = () => {
    this.setState({
      artefact: {
        ...newArtefact,
        userId: this.props.auth.user.id
      }
    });
  };

  // setter function for "loading" to show user that something is loading
  setLoading = loading => {
    this.setState({ loading });
  };

  // Setters for all the local state for newArtefacts
  setDateObtained = dateObtained => {
    this.setArtefact("dateObtained", dateObtained);
  };
  setTitle = title => {
    this.setArtefact("title", title);
  };
  setCategory = category => {
    this.setArtefact("category", category);
  };
  setDescription = description => {
    this.setArtefact("description", description);
  };
  setImageURI = imageURI => {
    this.setArtefact("imageURI", imageURI);
  };
  setPrivacy = privacy => {
    this.setArtefact("privacy", privacy);
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
  //prettier-ignore
  validateAllFields = () => {
    return new Promise((resolve, reject) => {
      const { title, imageURI, category, description, dateObtained, images } = this.state.artefact;
      const artefactPhoto = (images) ? images[0].URL : null;
      // validates against all field at the same time
      Promise.all([
        this.validateField("titleError", { title }),
        this.validateField("categoryError", { category }),
        this.validateField("descriptionError", { description }),
        this.validateField("dateObtainedError", { dateObtained }),
        this.validateField("imageError", { imageURI }, artefactPhoto),
      ]).then(() => {
        // done, can check the state now
        const { 
          imageError, 
          titleError, 
          descriptionError, 
          categoryError, 
          dateObtainedError
        } = this.state.errors;
        //valid inputs
        // if all inputs are not = "" or not null
        if (
          !imageError &&
          !titleError &&
          !descriptionError &&
          !categoryError &&
          !dateObtainedError
        ) {
          resolve(true);
        }
        // invalid inputs
        else {
          resolve(false);
        }
      })
    })
  };

  //prettier-ignore
  onSubmit = async () => {
    const { navigate } = this.props.navigation;
    // extract required parameters
    const { 
      origin, 
      isEditMode, 
      addToGroup, 
      groupId, 
      reloadDataAtOrigin,
      reloadDataAtSource 
    } = this.props.navigation.state.params;
    // wait for it to complete validating all fields
    // if validateAllField return false (gt errors), return early
    if (! await this.validateAllFields()) {
      return;
    }
    // all fields are valid //
    // show user the loading modal
    this.setLoading(true);
    // use appropriate action based on current page mode (either editing or creating)
    (() => {
      return isEditMode
        ? this.props.editSelectedArtefact(this.state.artefact)
        : this.props.createNewArtefact(this.state.artefact).then(res => {
          // check if it should add the artefact to group
          return addToGroup
            ? this.props.addArtefactToGroup(groupId, res.data._id)
            : Promise.resolve();
        });
    })()
      .then(() => {
        // stop showing user the loading modal
        this.setLoading(false);
        // reset new artefacts details
        this.resetArtefact();
        // reload data at artefact
        // reload data on origin/source page if required (it is not null)
        if (reloadDataAtOrigin) reloadDataAtOrigin();
        // navigate back to origin
        navigate(origin);

      })
      .catch(err => {
        // stop showing user the loading modal
        this.setLoading(false);
        // show error response
        console.log(err.response.data);
      });

  };

  // access camera roll to pick an image
  _pickImage = async () => {
    // wait for user to pick an image
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
    // extract selected artefact detail from parameter passed in
    const { artefact } = this.state;
    // decide which image source to use
    // if there no imageURI in state (no new changes or null)
    var imageSource = !artefact.imageURI
      ? // then check if there's a URL to selected Artefact image
        !artefact || !artefact.images
        ? // if no, then use default pic
          require("../../../../assets/images/icons/addPicture.png")
        : // there's URL to image, so use it
          { uri: artefact.images[0].URL }
      : // User picks a new image to be uploaded
        { uri: artefact.imageURI };

    // error messages
    const { errors } = this.state;

    return (
      <KeyboardShift>
        {() => (
          <View style={styles.container}>
            {/* loading modal window */}
            <ActivityLoaderModal loading={this.state.loading} />

            {/* invisible container for all content */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View>
                {/* Add image button */}
                <View style={styles.imagePlaceholder}>
                  <Text style={[styles.font, styles.imageText]}>
                    Share your artefacts for others to view
                  </Text>
                  {/* show current selected artefact image if exists  */}
                  <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={this._pickImage}
                  >
                    <Image style={styles.imageSelected} source={imageSource} />
                  </TouchableOpacity>

                  {/* error messages if there's any */}
                  {errors.imageError != "" ? (
                    <Text style={[styles.error, { alignSelf: "center" }]}>
                      {errors.imageError}
                    </Text>
                  ) : (
                    <Text style={[styles.subFont, styles.imageText]}>
                      Add images of your artefacts
                    </Text>
                  )}
                </View>

                {/* input fields */}

                {/* Title */}
                <View style={styles.inputRow}>
                  <Image
                    style={styles.icon}
                    source={require("../../../../assets/images/icons/title.png")}
                  />
                  <View style={styles.inputField}>
                    <Text style={styles.font}>Title</Text>
                    <TextInput
                      placeholder="'My First Car'"
                      autoCapitalize="none"
                      placeholderTextColor="#868686"
                      style={styles.inputFont}
                      onChangeText={value => this.setTitle(value)}
                      value={artefact.title}
                    />
                  </View>
                </View>
                {/* error messages if there's any */}
                {errors.titleError !== "" && (
                  <Text style={[styles.error, { marginLeft: wd(0.08) }]}>
                    {errors.titleError}
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
                      placeholder="Describe your artefact"
                      autoCapitalize="none"
                      placeholderTextColor="#868686"
                      style={styles.inputFont}
                      onChangeText={value => this.setDescription(value)}
                      value={artefact.description}
                    />
                  </View>
                </View>
                {/* error messages if there's any */}
                {errors.descriptionError !== "" && (
                  <Text style={[styles.error, { marginLeft: wd(0.08) }]}>
                    {" "}
                    {errors.descriptionError}{" "}
                  </Text>
                )}

                {/* Category */}
                <View style={styles.inputRow}>
                  <Image
                    style={styles.icon}
                    source={require("../../../../assets/images/icons/category.png")}
                  />
                  <View style={styles.inputField}>
                    <Text style={styles.font}>Category</Text>
                    <Picker
                      style={styles.pickerLong}
                      selectedValue={artefact.category}
                      onValueChange={this.setCategory.bind(this)}
                    >
                      <Picker.Item label="Art" value="Art" />
                      <Picker.Item label="Books" value="Books" />
                      <Picker.Item label="Furniture" value="Furniture" />
                      <Picker.Item
                        label="Clothing and Fabric"
                        value="Clothing and Fabric"
                      />
                      <Picker.Item
                        label="Coins and Currency"
                        value="Coins and Currency"
                      />
                      <Picker.Item label="Pottery" value="Pottery" />
                      <Picker.Item
                        label="Flims and Television"
                        value="Flims and Television"
                      />
                      <Picker.Item
                        label="Kitchen Collectable"
                        value="Kitchen Collectable"
                      />
                      <Picker.Item label="Music" value="Music" />
                      <Picker.Item label="Technology" value="Technology" />
                      <Picker.Item label="Pepe" value="Pepe" />
                      <Picker.Item label="Others" value="Others" />
                    </Picker>
                  </View>
                </View>
                {/* error messages if there's any */}
                {errors.categoryError !== "" && (
                  <Text style={[styles.error, { marginLeft: wd(0.08) }]}>
                    {" "}
                    {errors.categoryError}{" "}
                  </Text>
                )}

                {/* Dropdown selector fields */}
                <View style={styles.inputRow}>
                  {/* Date */}
                  <View style={{ flex: 0.5, flexDirection: "row" }}>
                    <Image
                      style={styles.icon}
                      source={require("../../../../assets/images/icons/calendar.png")}
                    />
                    <View>
                      <Text style={styles.font}>Date</Text>
                      <DatePicker
                        mode="date"
                        date={artefact.dateObtained}
                        style={styles.date}
                        placeholder="select date             ▾"
                        format="YYYY-MM-DD"
                        customStyles={{
                          dateIcon: {
                            display: "none"
                          },
                          dateInput: {
                            borderWidth: 0,
                            color: "black",
                            alignItems: "flex-start"
                          }
                        }}
                        selectedValue={artefact.dateObtained}
                        onDateChange={date => this.setDateObtained(date)}
                      />
                    </View>
                  </View>

                  {/* Privacy */}
                  <View style={{ flex: 0.5, flexDirection: "row" }}>
                    <Image
                      style={styles.icon}
                      source={require("../../../../assets/images/icons/privacy.png")}
                    />
                    <View>
                      <Text style={styles.font}>Privacy</Text>
                      <Picker
                        style={styles.pickerShort}
                        selectedValue={artefact.privacy}
                        onValueChange={value => this.setPrivacy(value)}
                      >
                        <Picker.Item label="Private" value={1} />
                        <Picker.Item label="Public" value={0} />
                      </Picker>
                    </View>
                  </View>
                </View>
                {/* error messages for date */}
                {errors.dateObtainedError !== "" && (
                  <Text style={[styles.error, { marginLeft: wd(0.08) }]}>
                    {" "}
                    {errors.dateObtainedError}{" "}
                  </Text>
                )}

                {/* submit button */}
                <View
                  style={{
                    alignItems: "flex-end",
                    marginVertical: wd(0.05),
                    width: wd(0.8)
                  }}
                >
                  {/* edit artefact or create new artefact */}
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
    fontSize: hp(0.015)
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
ArtefactsForm.propTypes = {
  artefacts: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  createNewArtefact: PropTypes.func.isRequired
};

// map required redux state to local props
const mapStateToProps = state => ({
  artefacts: state.artefacts,
  auth: state.auth
});

// map required redux state and actions to local props
export default connect(
  mapStateToProps,
  { createNewArtefact, editSelectedArtefact, addArtefactToGroup }
)(ArtefactsForm);
