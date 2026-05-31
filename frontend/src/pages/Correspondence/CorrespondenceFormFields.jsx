import Input from "../../components/Form/Input";
import Label from "../../components/Form/Label";
import Select from "../../components/Form/Select";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import TagSelector from "../../components/Form/TagSelector";
import pb from "../../pb";

export const DEFAULT_FORM_DATA = {
  name: "",
  direction: "in",
  type: "email",
  description: "",
  topic: "",
  date: "",
};

export function formDataFromRecord(record) {
  return {
    name: record.name || "",
    direction: record.direction || "in",
    type: record.type || "email",
    description: record.description || "",
    topic: record.topic || "",
    date: record.date ? record.date.substring(0, 10) : "",
  };
}

const CorrespondenceFormFields = ({ formData, setFormData, email }) => {
  const handleCreateTopic = async (title) => {
    return await pb.collection("bs_correspondence_topics").create({ title: title.trim() });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cf-date">Datum</Label>
        <Input
          id="cf-date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="cf-name">Naam</Label>
        <Input
          id="cf-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="cf-direction">Richting</Label>
        <Select
          id="cf-direction"
          value={formData.direction}
          onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
        >
          <option value="in">In</option>
          <option value="uit">Uit</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="cf-type">Type</Label>
        <Select
          id="cf-type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="brief">Brief</option>
          <option value="email">Email</option>
          <option value="app">App</option>
          <option value="gespreksnotitie">Gespreksnotitie</option>
          <option value="anders">Anders</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="cf-date">Datum</Label>
        <Input
          id="cf-date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="cf-description">Omschrijving</Label>
        <Input
          id="cf-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label>Tags</Label>
        <TagSelector type="email" item={email} placeholder="Type om tags te zoeken en selecteren..." />
      </div>
      <div>
        <Label>Discussie</Label>
        <FormFieldSelectAjax
          name="topic"
          collection="bs_correspondence_topics"
          searchFields={["title"]}
          optionDisplay="title"
          formData={formData}
          setFormData={setFormData}
          placeholder="Zoek een discussie..."
          create={handleCreateTopic}
        />
      </div>
    </div>
  );
};

export default CorrespondenceFormFields;
