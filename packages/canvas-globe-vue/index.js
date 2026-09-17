import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useAttrs,
  watch,
} from "vue";
import { GeoGlobe, mapAspect } from "canvas-globe";

export const CanvasGlobe = defineComponent({
  name: "CanvasGlobe",
  inheritAttrs: false,
  props: {
    options: { type: Object, default: () => ({}) },
    markers: { type: Array, default: undefined },
    arcs: { type: Array, default: undefined },
    licenseKey: { type: String, default: undefined },
  },
  emits: ["ready", "marker-hover", "marker-click", "country-hover", "country-click", "render"],
  setup(props, { emit, expose }) {
    const attrs = useAttrs();
    const canvas = shallowRef(null);
    const instance = shallowRef(null);

    const eventOptions = () => ({
      onHover: (marker, position) => {
        props.options.onHover?.(marker, position);
        emit("marker-hover", { marker, position });
      },
      onClick: (marker, position) => {
        props.options.onClick?.(marker, position);
        emit("marker-click", { marker, position });
      },
      onCountryHover: (country, position) => {
        props.options.onCountryHover?.(country, position);
        emit("country-hover", { country, position });
      },
      onCountryClick: (country, position) => {
        props.options.onCountryClick?.(country, position);
        emit("country-click", { country, position });
      },
      onRender: (globe) => {
        props.options.onRender?.(globe);
        emit("render", globe);
      },
    });

    const resolvedOptions = () => ({
      ...props.options,
      ...(props.markers === undefined ? {} : { markers: props.markers }),
      ...(props.arcs === undefined ? {} : { arcs: props.arcs }),
      ...(props.licenseKey === undefined ? {} : { licenseKey: props.licenseKey }),
      ...eventOptions(),
    });

    onMounted(() => {
      const globe = new GeoGlobe(canvas.value, resolvedOptions());
      instance.value = globe;
      emit("ready", globe);
    });

    onBeforeUnmount(() => {
      instance.value?.destroy();
      instance.value = null;
    });

    watch(
      () => props.options,
      () => instance.value?.setOptions(resolvedOptions()),
      { deep: true },
    );
    watch(
      () => props.markers,
      (markers) => {
        if (markers !== undefined) instance.value?.setMarkers(markers);
      },
      { deep: true },
    );
    watch(
      () => props.arcs,
      (arcs) => {
        if (arcs !== undefined) instance.value?.setArcs(arcs);
      },
      { deep: true },
    );
    watch(
      () => props.licenseKey,
      (licenseKey) => {
        if (licenseKey !== undefined) instance.value?.setOptions({ licenseKey });
      },
    );

    const aspect = computed(() => props.options.mode === "map"
      ? 1 / mapAspect(props.options.latRange, props.options.projection)
      : 1);

    expose({
      instance,
      flyTo: (...args) => instance.value?.flyTo(...args),
      fitTo: (...args) => instance.value?.fitTo(...args),
      snapshot: (...args) => instance.value?.snapshot(...args),
    });

    return () => h("canvas", {
      ...attrs,
      ref: canvas,
      style: [{ display: "block", width: "100%", aspectRatio: String(aspect.value) }, attrs.style],
    });
  },
});

export const Globe = CanvasGlobe;
export default CanvasGlobe;
