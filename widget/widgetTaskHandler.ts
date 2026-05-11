import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { FocusWidget } from "./FocusWidget";
import { StreakWidget } from "./StreakWidget";

export const WIDGET_DATA_KEY = "flow_widget_data";

export interface WidgetData {
  todayMins: number;
  streak: number;
  weekDays: boolean[]; // index 0 = Monday ... 6 = Sunday
}

const nameToWidget: Record<string, React.ComponentType<WidgetData>> = {
  FocusWidget,
  StreakWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetName = props.widgetInfo.widgetName;
  const Widget = nameToWidget[widgetName];

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE": {
      if (!Widget) break;
      const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      const data: WidgetData = raw
        ? JSON.parse(raw)
        : { todayMins: 0, streak: 0, weekDays: [false, false, false, false, false, false, false] };
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
