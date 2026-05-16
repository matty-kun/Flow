import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { FocusWidget } from "./FocusWidget";

export const WIDGET_DATA_KEY = "flow_widget_data";

export interface WidgetData {
  todayMins: number;
  streak: number;
  weekDays: boolean[]; // index 0 = Monday ... 6 = Sunday
  accentColor: string;
}

const nameToWidget: Record<string, any> = {
  FocusWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetName = props.widgetInfo.widgetName;
  const Widget = nameToWidget[widgetName];

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE": {
      if (!Widget) break;
      const rawData = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      const accentColor = await AsyncStorage.getItem("flow_accent_color") || "#FBBF24";
      const data: WidgetData = {
        ...(rawData ? JSON.parse(rawData) : { todayMins: 0, streak: 0, weekDays: [false, false, false, false, false, false, false] }),
        accentColor,
      };
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
