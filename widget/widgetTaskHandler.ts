import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { FocusWidget } from "./FocusWidget";

export const WIDGET_DATA_KEY = "flow_widget_data";

export interface WidgetData {
  todayMins: number;
  streak: number;
}

const nameToWidget = {
  FocusWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetName = props.widgetInfo.widgetName as keyof typeof nameToWidget;
  const Widget = nameToWidget[widgetName];

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE": {
      const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      const data: WidgetData = raw
        ? JSON.parse(raw)
        : { todayMins: 0, streak: 0 };
      props.renderWidget(React.createElement(Widget, data));
      break;
    }
    case "WIDGET_CLICK":
      break;
    case "WIDGET_DELETED":
      break;
    default:
      break;
  }
}
