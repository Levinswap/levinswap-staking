import React from "react";
import { Image, TouchableHighlight, View } from "react-native";
import { useHistory, useLocation } from "react-router-dom";

import Constants from "expo-constants";

import { Spacing } from "../../constants/dimension";
import useLinker from "../../hooks/useLinker";
import FlexView from "../FlexView";
import SocialIcons from "../SocialIcons";

const FLAGS = {
    us: require("../../../assets/flags/us.png"),
    cn: require("../../../assets/flags/cn.png"),
    kr: require("../../../assets/flags/kr.png"),
    fr: require("../../../assets/flags/fr.png"),
    es: require("../../../assets/flags/es.png"),
    jp: require("../../../assets/flags/jp.png")
};

const ALCHEMY_URL = "https://dashboard.alchemyapi.io/signup";

const WebFooter = ({ simple = false }) => {
    const onPressAlchemy = useLinker(ALCHEMY_URL, "", "_blank");
    return (
        <View style={{ width: "100%", padding: Spacing.normal, alignItems: "center" }}>
            {!simple && (
                <>
                    <SocialIcons />
                    <TouchableHighlight onPress={onPressAlchemy}>
                        <Image
                            source={require("../../../assets/alchemy.png")}
                            style={{ width: 188, height: 40, marginTop: Spacing.tiny }}
                        />
                    </TouchableHighlight>
                </>
            )}
            <FlexView style={{ marginTop: Spacing.small }}>
                <Flag name={"us"} locale={"en"} />
                <Flag name={"es"} locale={"es"} />
                <Flag name={"fr"} locale={"fr"} />
                <Flag name={"cn"} locale={"zh"} />
                <Flag name={"jp"} locale={"jp"} />
                <Flag name={"kr"} locale={"ko"} />
            </FlexView>
        </View>
    );
};

const Flag = ({ name, locale }) => {
    const history = useHistory();
    const location = useLocation();
    const onPress = () => {
        history.push(location.pathname + "?locale=" + locale);
    };
    return (
        <TouchableHighlight onPress={onPress} style={{ marginHorizontal: 4 }}>
            <Image source={FLAGS[name]} style={{ width: 30, height: 20 }} />
        </TouchableHighlight>
    );
};

export default WebFooter;
