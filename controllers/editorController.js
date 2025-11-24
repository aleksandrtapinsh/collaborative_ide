import User from '../models/User.js';
import Project from '../models/Project.js';
import File from '../models/File.js';

export const saveFile = async (req, res) => {
    try {
        const codeBuffer = Buffer.from(req.body.code, 'utf-8');
        const projectName = req.body.projectName;
        const fileName = req.body.name;

<<<<<<< Updated upstream
        const user = await User.findById(req.user._id).populate("projects");
        
=======
        const user = await User.findById(req.user._id).populate("projects")

>>>>>>> Stashed changes
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const projects = user.projects || [];
        let project = projects.find(p => p.name === projectName);

        if (!project) {
            project = new Project({
                name: projectName,
                owner: user._id,
                sharedWith: [],
                dateCreated: new Date(),
                files: []
            });

            user.projects.push(project._id);
            console.log(`Created project: ${projectName}`);
        }

        console.log(`\nSaving ${fileName} to ${req.user.username}/${projectName}`);

<<<<<<< Updated upstream
        const files = project.files || [];
        let file = files.find(f => f.name === fileName);
=======
        const fileList = await File.find({ projectId: project._id })
        let file = fileList.find(f => f.fname === fileName)
        console.log(`File: ${file}`)
>>>>>>> Stashed changes

        if (!file) {
            file = new File({
                projectId: project._id,
                dirPath: user.username + projectName + "/",
                fname: fileName,
                extention: "txt",
                contents: codeBuffer
<<<<<<< Updated upstream
            });
=======
            })

            await file.save()
            project.files.push(file._id)
            console.log(`Created new file ${fileName}`)
>>>>>>> Stashed changes
        } else {
            if (file.contents !== codeBuffer) {
                file.contents = codeBuffer;
            }
<<<<<<< Updated upstream
            console.log(`File already exists, updated ${fileName}`);
        }

        console.log(file);
        project.files.push(file);
        
        await file.save();
        await project.save();
        await user.save();
        
        console.log("File Saved");
        res.json({ success: true, message: "File saved successfully" });
=======
            await file.save()
            console.log(`File already exists, updated ${fileName}`)
        }

        console.log(file)

        await project.save()
        await user.save()

        console.log("File Saved")
        res.json({ success: true, message: "File saved successfully" })
>>>>>>> Stashed changes
    } catch (error) {
        console.error("Save file error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

export const openFile = async (req, res) => {
    try {
        const project = await Project.findOne({ name: 'test' }).populate('files');
        const fileName = req.params.id;

        console.log(`Looking for ${fileName}`);
        console.log(`Files in project: ${project.files}`);

<<<<<<< Updated upstream
        const file = project.files.find(f => f.fname === fileName);
        
=======
        const file = project.files.find(f => f.fname === fileName)

>>>>>>> Stashed changes
        if (!file) {
            console.log("File not Found");
            return res.status(404).json({ error: "File not found" });
        }

        console.log(`Found: ${file}`);
        const fileContents = file.contents.toString('utf8');
        console.log(`File contents: ${fileContents}`);

        res.json({
            fileName: file.fname,
            contents: fileContents,
<<<<<<< Updated upstream
        });
=======
        })
    } catch (err) {
        console.error("Server Error: ", err)
        res.status(500).json({ error: "Server Error" })
    }
};

export const newProject = async (req, res) => {
    try {
        const projectName = req.body.projectName;
        const user = await User.findById(req.user._id).populate("projects");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        if (!projectName) {
            return res.status(400).json({ message: "Project name is required" });
        }
        const existingProject = user.projects.find(p => p.name === projectName);
        if (existingProject) {
            return res.status(400).json({ message: "Project with this name already exists" });
        }
        else {
            const newProject = new Project({
                name: projectName,
                owner: user._id,
                sharedWith: [],
                dateCreated: new Date(),
                files: []
            })

            console.log("Creating new project...")
            user.projects.push(newProject._id)
            await newProject.save();
            await user.save();
            console.log("Project Created")
            res.json({ success: true, message: "Project created successfully", project: newProject });
        }
    }
    catch (err) {
        console.error("Server Error: ", err);
        res.status(500).json({ error: "Server Error" });
    }
}

export const loadProjects = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "projects",
            populate: {
                path: "files"
            }
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        res.json({ projects: user.projects });
>>>>>>> Stashed changes
    } catch (err) {
        console.error("Server Error: ", err);
        res.status(500).json({ error: "Server Error" });
    }
<<<<<<< Updated upstream
};
=======
}

export const createFile = async (req, res) => {
    try {
        const { projectName, fileName } = req.body;
        const user = await User.findById(req.user._id).populate("projects");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const project = user.projects.find(p => p.name === projectName);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await project.populate("files");
        const existingFile = project.files.find(f => f.fname === fileName);

        if (existingFile) {
            return res.status(400).json({ message: "File already exists" });
        }

        const newFile = new File({
            projectId: project._id,
            dirPath: user.username + "/" + projectName + "/",
            fname: fileName,
            extention: fileName.split('.').pop() || "txt",
            contents: Buffer.from("", 'utf-8')
        });

        await newFile.save();
        project.files.push(newFile._id);
        await project.save();

        console.log(`Created file ${fileName} in project ${projectName}`);
        res.json({ success: true, message: "File created successfully", file: newFile });

    } catch (error) {
        console.error("Create file error:", error);
        res.status(500).json({ error: "Server Error" });
    }
}

export const deleteFile = async (req, res) => {
    try {
        const { projectName, fileName } = req.body;
        const user = await User.findById(req.user._id).populate("projects");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const project = user.projects.find(p => p.name === projectName);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await project.populate("files");
        const file = project.files.find(f => f.fname === fileName);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Remove file from database
        await File.findByIdAndDelete(file._id);

        // Remove file reference from project
        project.files = project.files.filter(f => f._id.toString() !== file._id.toString());
        await project.save();

        console.log(`Deleted file ${fileName} from project ${projectName}`);
        res.json({ success: true, message: "File deleted successfully" });

    } catch (error) {
        console.error("Delete file error:", error);
        res.status(500).json({ error: "Server Error" });
    }
}

export const deleteProject = async (req, res) => {
    try {
        const { projectName } = req.body;
        const user = await User.findById(req.user._id).populate("projects");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const project = user.projects.find(p => p.name === projectName);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Delete all files in the project
        await File.deleteMany({ projectId: project._id });

        // Remove project from user's projects
        user.projects = user.projects.filter(p => p._id.toString() !== project._id.toString());
        await user.save();

        // Delete the project itself
        await Project.findByIdAndDelete(project._id);

        console.log(`Deleted project ${projectName} and all its files`);
        res.json({ success: true, message: "Project deleted successfully" });

    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({ error: "Server Error" });
    }
}
>>>>>>> Stashed changes
