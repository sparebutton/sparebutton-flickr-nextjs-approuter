import { Site } from "@/config/Site";

// render
export const Footer = () => {
    return (
        <footer className="text-center py-5 text-xs sticky top-full">
            <p>&copy; {Site.name}.</p>
        </footer>
    );
};
