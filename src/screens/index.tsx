import React, { lazy, Suspense, useContext, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Icon } from "react-native-elements";
import { HashRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer, Theme } from "@react-navigation/native";
import useAsyncEffect from "use-async-effect";
import MobileWebMenu from "../components/web/MobileWebMenu";
import WebHeader from "../components/web/WebHeader";
import { IS_DESKTOP } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import EmptyScreen from "./EmptyScreen";

const StakeScreen = lazy(() => import("./StakeScreen"));
const UnstakeScreen = lazy(() => import("./UnstakeScreen"));

export const Screens = () => {
    const { load } = useContext(GlobalContext);
    useAsyncEffect(load, []);
    return Platform.OS === "web" ? <WebScreens /> : <AppScreens />;
};

// tslint:disable-next-line:max-func-body-length
const WebScreens = () => {
    const { address } = useContext(EthersContext);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const { background } = useColors();
    useEffect(() => {
        if (!address) setMenuExpanded(false);
    }, [address]);
    return (
        <Router>
            <View style={{ flex: 1, backgroundColor: background }}>
                <Suspense fallback={<EmptyScreen />}>
                    <Switch>
                        <Route path={"/staking/unstake"}>
                            <UnstakeScreen />
                        </Route>
                        <Route path={"/staking"}>
                            <StakeScreen />
                        </Route>
                        <Redirect to={"/staking"} />
                    </Switch>
                </Suspense>
                <WebHeader onExpandMenu={() => setMenuExpanded(true)} />
                {!IS_DESKTOP && <MobileWebMenu expanded={menuExpanded} onCollapse={() => setMenuExpanded(false)} />}
            </View>
        </Router>
    );
};

const Tab = createBottomTabNavigator();

const AppScreens = () => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, accent, background, border, textDark, disabled } = useColors();
    const theme: Theme = {
        ...DefaultTheme,
        dark: darkMode,
        colors: {
            primary,
            background,
            border,
            card: background,
            notification: background,
            text: textDark
        }
    };
    return (
        <NavigationContainer theme={theme}>
            <Tab.Navigator
                tabBarOptions={{
                    activeTintColor: accent,
                    inactiveTintColor: disabled,
                    labelStyle: { marginBottom: 4 }
                }}>
                <Tab.Screen name="Home" component={SwapScreen} options={tabOptions("home")} />
                <Tab.Screen name="Liquidity" component={LiquidityScreen} options={tabOptions("water")} />
                <Tab.Screen name="Farming" component={FarmingScreen} options={tabOptions("leaf")} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const tabOptions = iconName => ({
    tabBarIcon: ({ color }) => <Icon type={"material-community"} name={iconName} color={color} />
});
