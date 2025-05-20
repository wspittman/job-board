import { readdir } from "fs/promises";

export async function fillCompanyTests() {
  const fileNames = await readdir("./evals/fillCompanyInputs");

  return [
    {
      vars: {
        inputFile: fileNames,
      },
      assert: [
        {
          type: "contains",
          transform: "output.industry",
          value: "Professional",
        },
      ],
    },
  ];
}
