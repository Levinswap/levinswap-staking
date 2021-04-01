import React, { useCallback, useContext, useMemo, useState } from "react";
import { FlatList, Platform, View } from "react-native";

import moment from "moment";
import useAsyncEffect from "use-async-effect";
import BackgroundImage from "../components/BackgroundImage";
import Button from "../components/Button";
import ChangeNetwork from "../components/ChangeNetwork";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import Expandable from "../components/Expandable";
import FlexView from "../components/FlexView";
import InfoBox from "../components/InfoBox";
import { ITEM_SEPARATOR_HEIGHT } from "../components/ItemSeparator";
import Loading from "../components/Loading";
import Meta from "../components/Meta";
import Selectable from "../components/Selectable";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenAmount from "../components/TokenAmount";
import TokenLogo from "../components/TokenLogo";
import TokenSymbol from "../components/TokenSymbol";
import WebFooter from "../components/web/WebFooter";
import { SwapSubMenu } from "../components/web/WebSubMenu";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useMyLimitOrdersState, { MyLimitOrdersState } from "../hooks/useMyLimitOrdersState";
import { Order } from "../hooks/useSettlement";
import useTranslation from "../hooks/useTranslation";
import MetamaskError from "../types/MetamaskError";
import { formatBalance } from "../utils";
import Screen from "./Screen";

const MyLimitOrdersScreen = () => {
    const t = useTranslation();
    return (
        <Screen>
            <Container>
                <BackgroundImage />
                <Content>
                    <Title text={t("my-orders")} />
                    <Text light={true}>{t("my-orders-desc")}</Text>
                    <MyLimitOrders />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
            <SwapSubMenu />
        </Screen>
    );
};

const MyLimitOrders = () => {
    const { chainId } = useContext(EthersContext);
    const state = useMyLimitOrdersState();
    if (chainId !== 100) return <ChangeNetwork />;
    return (
        <View style={{ marginTop: Spacing.large }}>
            <OrderSelect state={state} />
            <OrderInfo state={state} />
        </View>
    );
};

const OrderSelect = (props: { state: MyLimitOrdersState }) => {
    const t = useTranslation();
    return (
        <View>
            <Expandable
                title={t("limit-orders")}
                expanded={!props.state.selectedOrder}
                onExpand={() => props.state.setSelectedOrder()}>
                <OrderList state={props.state} />
            </Expandable>
            {props.state.selectedOrder && (
                <OrderItem
                    order={props.state.selectedOrder}
                    selected={true}
                    onSelectOrder={() => props.state.setSelectedOrder()}
                />
            )}
        </View>
    );
};

const OrderList = ({ state }: { state: MyLimitOrdersState }) => {
    const renderItem = useCallback(
        ({ item }) => {
            return (
                <OrderItem key={item.address} order={item} selected={false} onSelectOrder={state.setSelectedOrder} />
            );
        },
        [state.setSelectedOrder]
    );
    return state.loading || !state.myOrders ? (
        <Loading />
    ) : state.myOrders.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList data={state.myOrders} renderItem={renderItem} />
    );
};

const EmptyList = () => {
    const t = useTranslation();
    return (
        <View style={{ margin: Spacing.normal }}>
            <Text disabled={true} style={{ textAlign: "center", width: "100%" }}>
                {t("you-dont-have-limit-orders")}
            </Text>
        </View>
    );
};

const OrderItem = (props: { order: Order; selected: boolean; onSelectOrder: (order: Order) => void }) => {
    const t = useTranslation();
    const { amountIn, amountOutMin, fromToken, toToken } = props.order;
    const status = props.order.status();
    const disabled = status !== "Open";
    const price = Fraction.fromTokens(amountOutMin, amountIn, toToken, fromToken);
    const onPress = useCallback(() => props.onSelectOrder(props.order), [props.onSelectOrder, props.order]);
    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            containerStyle={{
                marginBottom: ITEM_SEPARATOR_HEIGHT
            }}>
            <FlexView style={{ alignItems: "center" }}>
                <View>
                    <Token token={fromToken} amount={amountIn} disabled={disabled} buy={false} />
                    <View style={{ height: Spacing.tiny }} />
                    <Token token={toToken} amount={amountOutMin} disabled={disabled} buy={true} />
                </View>
                <Field
                    label={t("price")}
                    value={props.order.canceled ? t("canceled") : price.toString(8)}
                    disabled={disabled}
                    minWidth={0}
                />
            </FlexView>
        </Selectable>
    );
};

const Token = ({ token, amount, disabled, buy }) => {
    const { green, red, disabled: colorDisabled } = useColors();
    return (
        <FlexView style={{ alignItems: "center" }}>
            <TokenLogo small={true} token={token} disabled={disabled} />
            <Text
                fontWeight={"bold"}
                note={true}
                style={{ color: disabled ? colorDisabled : buy ? green : red, marginLeft: Spacing.tiny }}>
                {buy ? "﹢" : "﹣"}
            </Text>
            <TokenAmount token={token} amount={amount} disabled={disabled} />
            {IS_DESKTOP && <TokenSymbol token={token} disabled={disabled} />}
        </FlexView>
    );
};

const Field = ({ label, value, disabled, minWidth }) => {
    const { textMedium, textLight, disabled: colorDisabled } = useColors();
    return (
        <View style={{ flex: minWidth ? 0 : 1, minWidth, marginLeft: Spacing.tiny }}>
            <Text note={true} style={{ textAlign: "right", color: disabled ? colorDisabled : textLight }}>
                {label}
            </Text>
            <Text
                caption={true}
                light={true}
                style={{ textAlign: "right", color: disabled ? colorDisabled : textMedium }}>
                {value}
            </Text>
        </View>
    );
};

const OrderInfo = ({ state }: { state: MyLimitOrdersState }) => {
    const t = useTranslation();
    const order = state.selectedOrder;
    const amountIn = order ? formatBalance(order.amountIn, order.fromToken.decimals) : undefined;
    const amountOutMin = order ? formatBalance(order.amountOutMin, order.toToken.decimals) : undefined;
    const filledAmountIn = order ? formatBalance(order.filledAmountIn!, order.fromToken.decimals) : undefined;
    const expiry = useMemo(() => {
        if (order) {
            const deadline = new Date(order.deadline.toNumber() * 1000);
            const now = Date.now();
            const diff = moment(deadline).diff(now);
            return moment(deadline).isAfter(now) ? moment.utc(diff).format("HH[h] mm[m]") : null;
        }
    }, [order]);
    const disabled = !state.selectedOrder;
    return (
        <InfoBox>
            <Meta label={t("status")} text={order?.status()} disabled={disabled} />
            <Meta
                label={t("amount-filled")}
                text={filledAmountIn}
                suffix={order?.fromToken?.symbol}
                disabled={disabled}
            />
            <Meta label={t("amount-to-sell")} text={amountIn} suffix={order?.fromToken?.symbol} disabled={disabled} />
            <Meta label={t("amount-to-buy")} text={amountOutMin} suffix={order?.toToken?.symbol} disabled={disabled} />
            <Meta label={t("expiration")} text={expiry || undefined} disabled={disabled} />
            <FilledEvents state={state} />
            <Controls state={state} />
        </InfoBox>
    );
};

const FilledEvents = ({ state }: { state: MyLimitOrdersState }) => {
    const t = useTranslation();
    const prefix = "https://etherscan.io/tx/";
    return (
        <View>
            {state.filledEvents &&
                state.filledEvents.map((event, i) => {
                    const hash = event.transactionHash;
                    const tx = hash.substring(0, 10) + "..." + hash.substring(hash.length - 8);
                    return <Meta key={i} label={t("filled-tx-no") + i} text={tx} url={prefix + hash} />;
                })}
        </View>
    );
};

const Controls = ({ state }: { state: MyLimitOrdersState }) => {
    const { chainId } = useContext(EthersContext);
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedOrder]);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {chainId === 100 ? <CancelButton state={state} onError={setError} /> : <ChangeNetwork />}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const CancelButton = ({ state, onError }: { state: MyLimitOrdersState; onError: (e) => void }) => {
    const t = useTranslation();
    const onPress = useCallback(() => {
        onError({});
        state.onCancelOrder().catch(onError);
    }, [state.onCancelOrder, onError]);
    const disabled = !state.selectedOrder || state.selectedOrder.status() !== "Open";
    return <Button title={t("cancel-order")} loading={state.cancellingOrder} onPress={onPress} disabled={disabled} />;
};

export default MyLimitOrdersScreen;
