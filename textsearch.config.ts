import { ExtractionConfig } from "src/textsearch/types/index";

const config: ExtractionConfig = {
    inputPaths: ["./src/stories/**/*.mdx", ".src/**/*.stories.tsx"],
    outputJson: true,
    jsxTextMap: {
        // Example: <Note>This is an inline JSX note.</Note>
        Note: ['children'],

        // Example: <Callout message="..." >Text</Callout>
        Callout: {
            props: ['message'],
            children: true,
            nestedTextSelectors: ['BodyText'],
        },

        // Example: <Banner title="New feature" />
        Banner: ['title'],

        // Example: <FooterText note="Generated automatically." />
        FooterText: {
            props: ['note'],
        },

        // Example: <TextBlock>Text here</TextBlock>
        TextBlock: ['children'],

        // Example: <Container> <TextBlock>...</TextBlock> </Container>
        Container: ['children'],

        // If you add <CustomButton text="Submit" />, support it like this:
        CustomButton: ['text'],
    },
};

export default config;