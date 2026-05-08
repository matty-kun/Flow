import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./widget/widgetTaskHandler";

registerWidgetTaskHandler(widgetTaskHandler);

import "expo-router/entry";
