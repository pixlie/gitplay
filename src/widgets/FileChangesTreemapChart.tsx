import { Component, createEffect } from "solid-js";
// import * as echarts from "echarts/core";
// import { TooltipComponent } from "echarts/components";
// import { TreemapChart } from "echarts/charts";
// import { CanvasRenderer } from "echarts/renderers";
import { useRepository } from "../stores/repository";

interface INestedFileTree {
  name: string;
  path: string;
  value?: number;
  children?: INestedFileTree[];
}

const colors = [
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc",
];

const FileChangesTreemapChart: Component = () => {
  const [repository] = useRepository();

  // echarts.use([TreemapChart, TooltipComponent, TreemapChart, CanvasRenderer]);
  // let chart: echarts.ECharts;

  const drawTreemapChart = (data: Array<INestedFileTree>) => {
    // We use the HTML canvas element to draw the chart
    const canvas = document.getElementById(
      "treemap-chart-container"
    ) as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    const chartArea = canvas.width * canvas.height;
    context.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    const drawRectangle = (
      dataSubset: Array<INestedFileTree>,
      containerDimensions: [number, number],
      containerStart: [number, number]
    ) => {
      // dataSubset may contain multiple entries, each with a value.
      // Each entry in dataSubset will be drawn as a rectangle,
      // with the size of the rectangle being proportional to the value of the entry.
      // The rectangles will form a treemap chart.

      // We calculate the total value of all the entries in dataSubset
      const totalValue = dataSubset.reduce((acc, x) => acc + x.value!, 0);
      for (const entry in dataSubset) {
        // We calculate the dimensions of the rectangle based on the value of the entry
        const entryDimensions = [
          (dataSubset[entry].value! / totalValue) * containerDimensions[0],
          (dataSubset[entry].value! / totalValue) * containerDimensions[1],
        ];
        // We calculate the start position of the rectangle based on the position of the container
        const entryStart = [
          containerStart[0] + entryDimensions[0],
          containerStart[1] + entryDimensions[1],
        ];
        // We draw the rectangle
        context.fillRect(
          entryStart[0],
          entryStart[1],
          entryDimensions[0],
          entryDimensions[1]
        );
        // If the entry has children, we draw the children as well
        // if (dataSubset[entry].children) {
        //   drawRectangle(
        //     dataSubset[entry].children,
        //     entryDimensions,
        //     entryStart
        //   );
        // }
      }
    };
    drawRectangle(data, [canvas.width, canvas.height], [0, 0]);
  };

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
    // if (!chart) {
    //   initiateChart();
    // }
    // !!chart &&
    //   chart.setOption({
    //     series: [
    //       {
    //         data: nestedFileTree,
    //       },
    //     ],
    //   });
    drawTreemapChart(nestedFileTree!);
  });

  // const getLevelOption = () => {
  //   return [
  //     {
  //       itemStyle: {
  //         borderWidth: 0,
  //         gapWidth: 5,
  //       },
  //     },
  //     {
  //       itemStyle: {
  //         gapWidth: 1,
  //       },
  //     },
  //     {
  //       colorSaturation: [0.35, 0.5],
  //       itemStyle: {
  //         gapWidth: 1,
  //         borderColorSaturation: 0.6,
  //       },
  //     },
  //   ];
  // };

  // const initiateChart = () => {
  //   chart = echarts.init(document.getElementById("treemap-chart-container")!);
  //   chart.setOption({
  //     animation: false,
  //     tooltip: {
  //       formatter: function (info: any) {
  //         var value = info.value;
  //         var treePathInfo = info.treePathInfo;
  //         var treePath = [];

  //         for (var i = 1; i < treePathInfo.length; i++) {
  //           treePath.push(treePathInfo[i].name);
  //         }

  //         return [
  //           '<div class="tooltip-title">' +
  //             echarts.format.encodeHTML(treePath.join("/")) +
  //             "</div>",
  //           "Disk Usage: " + echarts.format.addCommas(value) + " KB",
  //         ].join("");
  //       },
  //     },
  //     series: [
  //       {
  //         type: "treemap",
  //         visibleMin: 300,
  //         label: {
  //           show: true,
  //           formatter: "{b}",
  //         },
  //         itemStyle: {
  //           borderColor: "#fff",
  //         },
  //         levels: getLevelOption(),
  //       },
  //     ],
  //   });
  // };

  return <canvas class="h-full w-full" id="treemap-chart-container"></canvas>;
};

export default FileChangesTreemapChart;
