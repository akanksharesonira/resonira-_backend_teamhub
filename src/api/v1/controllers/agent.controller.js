const { Task, Employee, Project } = require('../../../database/models');
const { success, error } = require('../../../utils/response');
const OpenAI = require('openai');

// Initialize OpenAI client (requires process.env.OPENAI_API_KEY)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'placeholder_key' // Don't crash if key is missing initially
});

// Tool Definitions for the Agent
const tools = [
  {
    type: "function",
    function: {
      name: "get_user_tasks",
      description: "Get the list of tasks currently assigned to the user.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Update the status of a specific task.",
      parameters: {
        type: "object",
        properties: {
          task_id: {
            type: "integer",
            description: "The numeric ID of the task to update"
          },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "in_review", "done", "cancelled"],
            description: "The new status of the task"
          }
        },
        required: ["task_id", "status"]
      }
    }
  }
];

// Controller
const chatWithAgent = async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;
    
    if (!message) {
      return error(res, 'Message is required', 400);
    }

    // Identify the user context
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    const employeeId = employee ? employee.id : null;
    const employeeName = employee ? employee.first_name : req.user.email;

    // Build the system prompt with injected context
    const systemPrompt = `You are a helpful, professional internal productivity assistant for Resonira Workplace.
Your name is Reso.
You are currently talking to ${employeeName}.
Their Employee ID is ${employeeId}. Their Role is ${req.user.role}.
You have access to tools that can read and update their tasks. Use them when requested.
Always double-check the exact task ID before updating a status.
Keep your responses concise and action-oriented.`;

    // Initialize messages array for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation,
      { role: "user", content: message }
    ];

    // Check if real API key exists
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'placeholder_key') {
      return success(res, {
        message: "I am ready to help, but the OpenAI API Key is missing. Please add OPENAI_API_KEY to your backend .env file to enable my AI capabilities.",
        role: "assistant"
      });
    }

    // --- Phase 1: Call OpenAI ---
    let response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // or gpt-3.5-turbo
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // --- Phase 2: Execute Tool Calls if requested ---
    if (responseMessage.tool_calls) {
      messages.push(responseMessage); // Add assistant's tool call request to history

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResult = "";

        try {
          // Tool 1: Get User Tasks
          if (functionName === "get_user_tasks") {
            if (!employeeId) throw new Error("Could not find employee record for current user.");
            
            const tasks = await Task.findAll({
              where: { assignedTo: employeeId },
              include: [{ model: Project, as: 'project', attributes: ['name'] }],
              attributes: ['id', 'title', 'status', 'priority', 'due_date']
            });
            
            functionResult = tasks.length > 0 
                ? JSON.stringify(tasks) 
                : "No tasks assigned to you right now.";
          }
          
          // Tool 2: Update Task Status
          else if (functionName === "update_task_status") {
            const taskId = functionArgs.task_id;
            const newStatus = functionArgs.status;
            
            const task = await Task.findByPk(taskId);
            if (!task) {
              functionResult = `Error: Task ID ${taskId} not found.`;
            } else if (req.user.role === 'employee' && task.assignedTo !== employeeId) {
              functionResult = `Error: You do not have permission to update Task ID ${taskId}.`;
            } else {
              await task.update({ 
                status: newStatus,
                completed_at: newStatus === 'done' ? new Date() : task.completed_at
              });
              functionResult = `Successfully updated task ${taskId} to ${newStatus}.`;
            }
          }
        } catch (toolError) {
          console.error(`[AGENT TOOL ERROR] ${functionName}:`, toolError);
          functionResult = `Error executing tool: ${toolError.message}`;
        }

        // Send tool execution result back to OpenAI
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResult,
        });
      }

      // --- Phase 3: Get final response after tool execution ---
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: messages,
      });

      return success(res, {
        message: secondResponse.choices[0].message.content,
        role: "assistant"
      });
    }

    // If no tools were called, return standard text response
    return success(res, {
      message: responseMessage.content,
      role: "assistant"
    });

  } catch (err) {
    console.error(`[AGENT-ERROR] ${err.name}: ${err.message}`);
    return error(res, 'AI Agent failed to process request', 500);
  }
};

module.exports = {
  chatWithAgent
};
