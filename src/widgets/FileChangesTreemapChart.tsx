import { Component, createEffect, onMount } from "solid-js";
import * as echarts from "echarts/core";
import { TooltipComponent } from "echarts/components";
import { TreemapChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { useRepository } from "../stores/repository";
import path from "path";

interface INestedFileTree {
  name: string;
  path: string;
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
    console.log(nestedFileTree);
    if (!chart) {
      initiateChart();
    }
    !!chart &&
      chart.setOption({
        series: [
          {
            data: nestedFileTree,
          },
        ],
      });
  });

  const getLevelOption = () => {
    return [
      {
        itemStyle: {
          borderWidth: 0,
          gapWidth: 5,
        },
      },
      {
        itemStyle: {
          gapWidth: 1,
        },
      },
      {
        colorSaturation: [0.35, 0.5],
        itemStyle: {
          gapWidth: 1,
          borderColorSaturation: 0.6,
        },
      },
    ];
  };

  const initiateChart = () => {
    chart = echarts.init(document.getElementById("treemap-chart-container")!);
    chart.setOption({
      animation: false,
      tooltip: {
        formatter: function (info: any) {
          var value = info.value;
          var treePathInfo = info.treePathInfo;
          var treePath = [];

          for (var i = 1; i < treePathInfo.length; i++) {
            treePath.push(treePathInfo[i].name);
          }

          return [
            '<div class="tooltip-title">' +
              echarts.format.encodeHTML(treePath.join("/")) +
              "</div>",
            "Disk Usage: " + echarts.format.addCommas(value) + " KB",
          ].join("");
        },
      },
      series: [
        {
          type: "treemap",
          visibleMin: 300,
          label: {
            show: true,
            formatter: "{b}",
          },
          itemStyle: {
            borderColor: "#fff",
          },
          levels: getLevelOption(),
        },
      ],
    });
  };

  return <div class="h-full w-full" id="treemap-chart-container"></div>;
};

export default FileChangesTreemapChart;
