import { Component, createEffect, onMount } from "solid-js";
import * as echarts from "echarts/core";
import { TooltipComponent } from "echarts/components";
import { TreemapChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { useRepository } from "../stores/repository";
import getSmartSize from "../utils/misc";

interface INestedFileTree {
  name: string;
  path: string;
  id: string;
  value?: number;
  children?: INestedFileTree[];
}

const FileChangesTreemapChart: Component = () => {
  const [repository] = useRepository();

  echarts.use([TreemapChart, TooltipComponent, TreemapChart, CanvasRenderer]);
  let chart: echarts.ECharts;

  createEffect(() => {
    // We use Array.reduce function to create a nested object of all the folders and files in our data
    const initialValue: Array<INestedFileTree> = [];
    const nestedFileTree = repository.currentFileTree?.blobs.reduce(
      (acc: Array<INestedFileTree>, blob) => {
        // We split the path by "/" and leave out the file name (when it is not a directory)
        const pathParts = blob.path.split("/");
        const baseObject = blob.isDirectory ? { children: [] } : {};

        const createNestedPart = (
          temp: Array<INestedFileTree>,
          depth: number
        ) => {
          if (pathParts.length === depth) {
            return [
              ...temp,
              {
                ...baseObject,
                name: blob.name,
                path: blob.path,
                id: blob.path,
                value: blob.size,
              },
            ];
          } else {
            const index = temp.findIndex(
              (x) => x.path === pathParts.slice(0, depth).join("/")
            );
            temp[index] = {
              ...temp[index],
              children: createNestedPart(temp[index].children!, depth + 1),
              value: temp[index].children!.reduce(
                (acc, x) => acc + x.value!,
                0
              ),
            };
            return temp;
          }
        };

        return createNestedPart(acc, 1);
      },
      initialValue
    );
    !!chart &&
    chart.setOption({
      series: [
        {
          data: nestedFileTree,
        },
      ],
    }, initialValue.length ? {
      replaceMerge: ['series']
    } : {});
  });

  const getLevelOption = () => {
    return [
      {
        itemStyle: {
          borderWidth: 2,
          borderColor: 'black',
          gapWidth: 6,
        },
      },
      {
        itemStyle: {
          gapWidth: 5,
          borderWidth: 1,
          borderColor: 'gray',
        },
      },
      {
        colorSaturation: [0.35, 0.5],
        itemStyle: {
          gapWidth: 1,
          borderColorSaturation: 0.6,
          borderWidth: 1,
          borderColor: 'gray',
        },
      },
    ];
  };

  onMount(() => {
    // This will initiate the chart on mount
    initiateChart();
  });

  const initiateChart = () => {
    chart = echarts.init(
      document.getElementById("treemap-chart-container")!,
      {
        useDirtyRect: true,
        renderer: 'canvas',
        width: '100%',
        height: 'auto',
      }
    );
    chart.setOption({
      animation: true,
      animationDuration: 1,
      animationDurationUpdate: 1,
      animationThreshold: 1,
      animationDelayUpdate: 0,
      tooltip: {
        show: true,
        formatter: function (info: any) {
          const smartSize = getSmartSize(Number(info.value));
          return (
            <>
              <div class="tooltip-title">
                {echarts.format.encodeHTML(info.treePathInfo.map(x => x.name).join("/"))}
              </div>
              <small>Disk Usage: {echarts.format.addCommas(smartSize.size)} {smartSize.label}</small>
            </>
          );
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          width: "100%",
          top: "top",
          bottom: "30px",
          visibleMin: 300,
          colorMappingBy: "value",
          childrenVisibleMin: 400,
          leafDepth: 3,
          breadcrumb: {
            itemStyle: {
              borderJoin: "miter",
              textStyle: {
                fontWeight: "bold",
                fontSize: 16
              }
            },
          },
          label: {
            show: true,
            formatter: "{b}",
          },
          upperLabel: {
            show: true,
            fontWeight: "bold",
            shadowBlur: 0,
            fontSize: 18,
          },
          itemStyle: {
            borderColor: "gray",
            gapWidth: 5,
            borderWidth: 1
          },
          levels: getLevelOption(),
        },
      ],
      stateAnimation: {
        duration: 1
      },
      textStyle: {
        fontSize: 14
      },
      replaceMerge: ['series'],
    });
    window.addEventListener('resize', chart.resize, {});
  };

  return (
    <div class="w-1/3 md:w-2/3 lg:w-3/4 h-full pb-10" id="treemap-chart-container" />
  );
};

export default FileChangesTreemapChart;
