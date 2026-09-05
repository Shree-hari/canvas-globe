import React from "react";
import { Globe } from "@swiftools/geo-globe/react";
import * as geo from "@swiftools/geo-globe";

/**
 * Everything available inside ```jsx live code blocks. Readers can edit any
 * example in place and see the globe re-render.
 */
export default {
  React,
  ...React,
  Globe,
  ...geo,
};
