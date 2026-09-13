import React from "react";
import { Globe } from "canvas-globe/react";
import * as geo from "canvas-globe";

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
