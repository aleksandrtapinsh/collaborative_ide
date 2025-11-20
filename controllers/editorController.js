import User from '../models/User.js'
import Project from '../models/Project.js'
import File from '../models/File.js'

export const saveFile = async (req, res) => {
    try {
        const codeBuffer = Buffer.from(req.body.code, 'utf-8')
        const projectName = req.body.projectName
        const fileName = req.body.name

        const user = await User.findById(req.user._id).populate("projects")
        
        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const projects = user.projects || []
        let project = projects.find(p => p.name === projectName)

        if (!project) {
            project = new Project({
                name: projectName,
                owner: user._id,
                sharedWith: [],
                dateCreated: new Date(),
                files: []
            })

            user.projects.push(project._id)
            console.log(`Created project: ${projectName}`)
        }

        console.log(`\nSaving ${fileName} to ${req.user.username}/${projectName}`)

        const fileList = await File.find({ projectId: project._id})
        let file = fileList.find(f => f.fname === fileName)
        console.log(`File: ${file}`)

        if (!file) {
            file = new File({
                projectId: project._id,
                dirPath: user.username + "/" + projectName + "/",
                fname: fileName,
                extention: "txt",
                contents: codeBuffer
            })
        } else {
            if (file.contents !== codeBuffer) {
                file.contents = codeBuffer
            }
            console.log(`File already exists, updated ${fileName}`)
        }

        console.log(file)
        project.files.push(file)
        
        await file.save()
        await project.save()
        await user.save()
        
        console.log("File Saved")
        res.json({ success: true, message: "File saved successfully" })
    } catch (error) {
        console.error("Save file error:", error)
        res.status(500).json({ error: "Server Error" })
    }
}

export const openFile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("projects");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const projects = user.projects || [];
        let project = projects.find(p => p.name === req.query.projectName);

        await project.populate("files")
        const fileName = req.params.id;

        console.log(`Looking for ${fileName}`)
        console.log(`Files in project: ${project.files}`)

        const file = project.files.find(f => f.fname === fileName)
        
        if (!file) {
            console.log("File not Found")
            return res.status(404).json({ error: "File not found" })
        }

        console.log(`Found: ${file}`)
        const fileContents = file.contents.toString('utf8')
        console.log(`File contents: ${fileContents}`)

        res.json({
            fileName: file.fname,
            contents: fileContents,
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
        const user = await User.findById(req.user._id).populate("projects");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        res.json({ projects: user.projects });
    } catch (err) {
        console.error("Server Error: ", err);
        res.status(500).json({ error: "Server Error" });
    }
}